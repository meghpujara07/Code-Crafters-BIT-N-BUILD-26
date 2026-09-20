from uuid import UUID
from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require
from app.core.errors import ApiError
from app.core.util import money
from app.db.models import Budget, User
from app.ports import use

router = APIRouter(tags=["budgets"])

_SCOPES = {"GLOBAL", "PROVIDER", "ACCOUNT", "TAG"}
_ALLOWED = {"name", "scope", "scopeValue", "amountUsd", "period", "alertThresholds", "hardLimit"}
_PROVIDERS = {"AWS", "AZURE", "GCP"}


def _bad(message: str, field: str | None = None):
    raise ApiError(400, "VALIDATION_ERROR", message, [{"field": field, "reason": "invalid"}] if field else [])


def _validate(body: dict, current: Budget | None = None) -> tuple[str, str, str | None, float, str, list[int], bool]:
    if not isinstance(body, dict):
        _bad("Request body must be an object.")
    unknown = set(body) - _ALLOWED
    if unknown:
        raise ApiError(400, "VALIDATION_ERROR", "Unknown field(s).", [{"field": x, "reason": "unsupported"} for x in sorted(unknown)])
    if current is None:
        required = {"name", "scope", "amountUsd", "period", "alertThresholds", "hardLimit"}
        missing = sorted(required - set(body))
        if missing:
            raise ApiError(400, "VALIDATION_ERROR", "Missing required fields.", [{"field": x, "reason": "required"} for x in missing])
    elif not body:
        _bad("At least one field is required.")

    name = body.get("name", current.name if current else None)
    scope = body.get("scope", current.scope if current else None)
    scope_value = body.get("scopeValue", current.scope_value if current else None)
    amount = body.get("amountUsd", float(current.amount_usd) if current else None)
    period = body.get("period", current.period if current else None)
    thresholds = body.get("alertThresholds", current.alert_thresholds if current else None)
    hard_limit = body.get("hardLimit", current.hard_limit if current else None)

    if not isinstance(name, str) or not name.strip():
        _bad("name must be a non-empty string.", "name")
    if scope not in _SCOPES:
        _bad("Invalid scope.", "scope")
    if scope == "GLOBAL":
        if scope_value is not None:
            _bad("GLOBAL budgets must have scopeValue=null.", "scopeValue")
    elif scope == "PROVIDER":
        if scope_value not in _PROVIDERS:
            _bad("PROVIDER scopeValue must be AWS, AZURE or GCP.", "scopeValue")
    elif scope == "ACCOUNT":
        if not isinstance(scope_value, str):
            _bad("ACCOUNT budgets require a UUID scopeValue.", "scopeValue")
        try:
            UUID(scope_value)
        except (ValueError, TypeError):
            _bad("ACCOUNT scopeValue must be a UUID.", "scopeValue")
    elif scope == "TAG":
        if not isinstance(scope_value, str) or ":" not in scope_value or scope_value.split(":", 1)[0] == "":
            _bad("TAG scopeValue must be key:value.", "scopeValue")
    if isinstance(amount, bool) or not isinstance(amount, (int, float)) or amount < 0:
        _bad("amountUsd must be a non-negative number.", "amountUsd")
    if period != "MONTHLY":
        _bad("Only MONTHLY budgets are supported.", "period")
    if not isinstance(thresholds, list) or any(isinstance(x, bool) or not isinstance(x, int) or x < 0 or x > 100 for x in thresholds):
        _bad("alertThresholds must contain integers from 0 to 100.", "alertThresholds")
    if not isinstance(hard_limit, bool):
        _bad("hardLimit must be a boolean.", "hardLimit")
    return name.strip(), scope, scope_value, float(amount), period, list(thresholds), hard_limit


async def _out(db: AsyncSession, obj: Budget) -> dict:
    usage = await use("cost_engine").budget_usage(db, obj.id)
    used = money(usage.used_usd)
    forecast = money(usage.forecast_usd)
    percent = money((used / float(obj.amount_usd) * 100) if float(obj.amount_usd) else 0)
    return {
        "id": str(obj.id),
        "name": obj.name,
        "scope": obj.scope,
        "scopeValue": obj.scope_value,
        "amountUsd": money(obj.amount_usd),
        "period": obj.period,
        "alertThresholds": list(obj.alert_thresholds or []),
        "hardLimit": obj.hard_limit,
        "usedUsd": used,
        "usedPercent": percent,
        "forecastUsd": forecast,
    }


@router.get("/budgets")
async def list_budgets(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require("policies.read")),
):
    rows = (await db.execute(select(Budget).order_by(Budget.name.asc()))).scalars().all()
    return {"success": True, "data": [await _out(db, x) for x in rows]}


@router.post("/budgets", status_code=201)
async def create_budget(
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("budgets.write")),
):
    name, scope, scope_value, amount, period, thresholds, hard_limit = _validate(body)
    obj = Budget(name=name, scope=scope, scope_value=scope_value, amount_usd=amount, period=period, alert_thresholds=thresholds, hard_limit=hard_limit)
    db.add(obj)
    await db.flush()
    after = await _out(db, obj)
    await use("audit").write(db, actor_id=actor.id, action="CREATE_BUDGET", entity_type="BUDGET", entity_id=obj.id, before=None, after=after)
    await db.commit()
    return {"success": True, "data": after}


@router.patch("/budgets/{budget_id}")
async def update_budget(
    budget_id: UUID,
    body: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("budgets.write")),
):
    obj = (await db.execute(select(Budget).where(Budget.id == budget_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "Budget not found.")
    before = await _out(db, obj)
    name, scope, scope_value, amount, period, thresholds, hard_limit = _validate(body, obj)
    obj.name, obj.scope, obj.scope_value, obj.amount_usd, obj.period, obj.alert_thresholds, obj.hard_limit = name, scope, scope_value, amount, period, thresholds, hard_limit
    await db.flush()
    after = await _out(db, obj)
    await use("audit").write(db, actor_id=actor.id, action="UPDATE_BUDGET", entity_type="BUDGET", entity_id=obj.id, before=before, after=after)
    await db.commit()
    return {"success": True, "data": after}


@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require("budgets.write")),
):
    obj = (await db.execute(select(Budget).where(Budget.id == budget_id))).scalar_one_or_none()
    if not obj:
        raise ApiError(404, "NOT_FOUND", "Budget not found.")
    before = await _out(db, obj)
    await db.delete(obj)
    await db.flush()
    await use("audit").write(db, actor_id=actor.id, action="DELETE_BUDGET", entity_type="BUDGET", entity_id=budget_id, before=before, after=None)
    await db.commit()
    return {"success": True, "data": {"deleted": True}}
