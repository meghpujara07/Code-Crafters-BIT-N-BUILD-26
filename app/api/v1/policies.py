from uuid import UUID
from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require
from app.core.errors import ApiError
from app.core.rbac import ROLE_PERMISSIONS
from app.db.models import Policy, User
from app.ports import use

router = APIRouter(tags=["policies"])

_PROVIDERS = {"AWS", "AZURE", "GCP"}
_RESOURCE_TYPES = {"COMPUTE", "DATABASE", "STORAGE", "LOAD_BALANCER", "CONTAINER"}
_ACTIONS = {"SCALE_OUT", "SCALE_IN", "RESIZE", "EXPAND_STORAGE", "START", "STOP"}
_POLICY_TYPES = {"SAFETY_LIMIT", "APPROVAL_RULE"}
_ALLOWED = {"name", "type", "enabled", "priority", "scope", "rules"}
_SCOPE_KEYS = {"provider", "accountId", "resourceType", "tags"}
_SAFETY_KEYS = {"maxInstances", "minInstances", "maxScaleStepPercent", "maxCostIncreasePerActionUsd", "blockedActions", "allowedWindows"}
_APPROVAL_KEYS = {"requireApprovalWhen", "approverRole"}


def _bad(message: str, field: str | None = None):
    raise ApiError(400, "VALIDATION_ERROR", message, [{"field": field, "reason": "invalid"}] if field else [])


def _num(value: object, field: str, integer: bool = False, minimum: float = 0) -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or (integer and not isinstance(value, int)) or value < minimum:
        _bad(f"{field} is invalid.", field)


def _validate_scope(scope: object) -> dict:
    if not isinstance(scope, dict):
        _bad("scope must be an object.", "scope")
    unknown = set(scope) - _SCOPE_KEYS
    if unknown:
        raise ApiError(400, "VALIDATION_ERROR", "Unknown scope field(s).", [{"field": f"scope.{x}", "reason": "unsupported"} for x in sorted(unknown)])
    if "provider" in scope and scope["provider"] not in _PROVIDERS:
        _bad("Invalid provider.", "scope.provider")
    if "resourceType" in scope and scope["resourceType"] not in _RESOURCE_TYPES:
        _bad("Invalid resourceType.", "scope.resourceType")
    if "accountId" in scope:
        try:
            UUID(str(scope["accountId"]))
        except (ValueError, TypeError):
            _bad("accountId must be a UUID.", "scope.accountId")
    if "tags" in scope:
        if not isinstance(scope["tags"], dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in scope["tags"].items()):
            _bad("tags must be an object of string key/value pairs.", "scope.tags")
    return scope


def _validate_rules(policy_type: str, rules: object) -> dict:
    if not isinstance(rules, dict):
        _bad("rules must be an object.", "rules")
    allowed = _SAFETY_KEYS if policy_type == "SAFETY_LIMIT" else _APPROVAL_KEYS
    unknown = set(rules) - allowed
    if unknown:
        raise ApiError(400, "VALIDATION_ERROR", "Unknown rule field(s).", [{"field": f"rules.{x}", "reason": "unsupported"} for x in sorted(unknown)])
    if policy_type == "SAFETY_LIMIT":
        for field in ("maxInstances", "minInstances"):
            if field in rules:
                _num(rules[field], field, integer=True)
        if "maxScaleStepPercent" in rules:
            _num(rules["maxScaleStepPercent"], "maxScaleStepPercent")
            if rules["maxScaleStepPercent"] > 100:
                _bad("maxScaleStepPercent must be between 0 and 100.", "rules.maxScaleStepPercent")
        if "maxCostIncreasePerActionUsd" in rules:
            _num(rules["maxCostIncreasePerActionUsd"], "maxCostIncreasePerActionUsd")
        if "blockedActions" in rules:
            if not isinstance(rules["blockedActions"], list) or any(x not in _ACTIONS for x in rules["blockedActions"]):
                _bad("blockedActions contains an unsupported action.", "rules.blockedActions")
        if "allowedWindows" in rules:
            windows = rules["allowedWindows"]
            if not isinstance(windows, list):
                _bad("allowedWindows must be an array.", "rules.allowedWindows")
            for i, w in enumerate(windows):
                if not isinstance(w, dict):
                    _bad("Each allowed window must be an object.", f"rules.allowedWindows[{i}]")
                required = {"days", "startHour", "endHour", "timezone"}
                if set(w) != required:
                    _bad("Each allowed window must contain days, startHour, endHour, timezone.", f"rules.allowedWindows[{i}]")
                if not isinstance(w["days"], list) or any(isinstance(d, bool) or not isinstance(d, int) or d < 0 or d > 6 for d in w["days"]):
                    _bad("days must contain integers from 0 to 6.", f"rules.allowedWindows[{i}].days")
                for h in ("startHour", "endHour"):
                    if isinstance(w[h], bool) or not isinstance(w[h], int) or w[h] < 0 or w[h] > 23:
                        _bad(f"{h} must be between 0 and 23.", f"rules.allowedWindows[{i}].{h}")
                if not isinstance(w["timezone"], str) or not w["timezone"].strip():
                    _bad("timezone must be a non-empty string.", f"rules.allowedWindows[{i}].timezone")
    else:
        if set(rules) != {"requireApprovalWhen", "approverRole"}:
            _bad("Approval rules require requireApprovalWhen and approverRole.", "rules")
        trigger = rules["requireApprovalWhen"]
        if not isinstance(trigger, dict) or not trigger:
            _bad("requireApprovalWhen must contain at least one condition.", "rules.requireApprovalWhen")
        if isinstance(trigger, dict):
            unknown_trigger = set(trigger) - {"costDeltaMonthlyUsdGt", "actionTypeIn"}
            if unknown_trigger:
                raise ApiError(400, "VALIDATION_ERROR", "Unknown approval condition.", [{"field": f"rules.requireApprovalWhen.{x}", "reason": "unsupported"} for x in sorted(unknown_trigger)])
            if "costDeltaMonthlyUsdGt" in trigger:
                _num(trigger["costDeltaMonthlyUsdGt"], "costDeltaMonthlyUsdGt", minimum=0)
            if "actionTypeIn" in trigger:
                if not isinstance(trigger["actionTypeIn"], list) or not trigger["actionTypeIn"] or any(x not in _ACTIONS for x in trigger["actionTypeIn"]):
                    _bad("actionTypeIn must contain at least one supported action.", "rules.requireApprovalWhen.actionTypeIn")
        if rules["approverRole"] not in {"MANAGER", "ADMIN"}:
            _bad("approverRole must be MANAGER or ADMIN.", "rules.approverRole")
    return rules


def _validate_policy(body: dict, partial: bool = False, current: Policy | None = None) -> tuple[str, str, bool, int, dict, dict]:
    if not isinstance(body, dict):
        _bad("Request body must be an object.")
    unknown = set(body) - _ALLOWED
    if unknown:
        raise ApiError(400, "VALIDATION_ERROR", "Unknown field(s).", [{"field": x, "reason": "unsupported"} for x in sorted(unknown)])
    if partial and not body:
        _bad("At least one field is required.")
    if current is None:
        for field in ("name", "type", "enabled", "priority", "scope", "rules"):
            if field not in body:
                _bad(f"{field} is required.", field)
        name, ptype, enabled, priority, scope, rules = (body[k] for k in ("name", "type", "enabled", "priority", "scope", "rules"))
    else:
        name = body.get("name", current.name)
        ptype = body.get("type", current.type)
        enabled = body.get("enabled", current.enabled)
        priority = body.get("priority", current.priority)
        scope = body.get("scope", current.scope)
        rules = body.get("rules", current.rules)
    if not isinstance(name, str) or not name.strip():
        _bad("name must be a non-empty string.", "name")
    if ptype not in _POLICY_TYPES:
        _bad("Invalid policy type.", "type")
    if not isinstance(enabled, bool):
        _bad("enabled must be a boolean.", "enabled")
    _num(priority, "priority", integer=True, minimum=0)
    return name.strip(), ptype, enabled, priority, _validate_scope(scope), _validate_rules(ptype, rules)


def _out(obj: Policy) -> dict:
    return {"id": str(obj.id), "name": obj.name, "type": obj.type, "enabled": obj.enabled, "priority": obj.priority, "scope": obj.scope, "rules": obj.rules}


@router.get("/policies")
async def list_policies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require("policies.read")),
):
    rows = (await db.execute(select(Policy).order_by(Policy.priority.asc(), Policy.name.asc()))).scalars().all()
    return {"success": True, "data": [_out(x) for x in rows]}


@router.post("/policies", status_code=201)
async def create_policy(
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("policies.write")),
):
    name, ptype, enabled, priority, scope, rules = _validate_policy(body)
    obj = Policy(name=name, type=ptype, enabled=enabled, priority=priority, scope=scope, rules=rules)
    db.add(obj)
    await db.flush()
    after = _out(obj)
    await use("audit").write(db, actor_id=actor.id, action="CREATE_POLICY", entity_type="POLICY", entity_id=obj.id, before=None, after=after)
    await db.commit()
    return {"success": True, "data": after}


@router.patch("/policies/{policy_id}")
async def update_policy(
    policy_id: UUID,
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("policies.write")),
):
    obj = (await db.execute(select(Policy).where(Policy.id == policy_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "Policy not found.")
    before = _out(obj)
    name, ptype, enabled, priority, scope, rules = _validate_policy(body, partial=True, current=obj)
    obj.name, obj.type, obj.enabled, obj.priority, obj.scope, obj.rules = name, ptype, enabled, priority, scope, rules
    await db.flush()
    after = _out(obj)
    await use("audit").write(db, actor_id=actor.id, action="UPDATE_POLICY", entity_type="POLICY", entity_id=obj.id, before=before, after=after)
    await db.commit()
    return {"success": True, "data": after}


@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("policies.write")),
):
    obj = (await db.execute(select(Policy).where(Policy.id == policy_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "Policy not found.")
    before = _out(obj)
    await db.delete(obj)
    await db.flush()
    await use("audit").write(db, actor_id=actor.id, action="DELETE_POLICY", entity_type="POLICY", entity_id=policy_id, before=before, after=None)
    await db.commit()
    return {"success": True, "data": {"deleted": True}}


@router.get("/rbac/roles")
async def list_roles(
    _: User = Depends(require("policies.read")),
):
    return {"success": True, "data": [{"role": role, "permissions": list(permissions)} for role, permissions in ROLE_PERMISSIONS.items()]}

