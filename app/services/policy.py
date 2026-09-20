from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import ROLE_ORDER, permissions_for, role_at_least
from app.core.util import money, utcnow
from app.db.models import Budget, Policy, Resource
from app.ports import use
from app.schemas.common import ActionParams, MoneyImpact, ProposedAction, ValidationCheck, ValidationResult


class PolicyEngine:
    """P2 decision engine. Structural validation belongs to the orchestrator."""

    async def check_limits(
        self,
        db: AsyncSession,
        resource_id,
        action: ProposedAction,
        impact: MoneyImpact,
    ) -> ValidationResult:
        # Preserve C1/C2 port-stub behavior when called without a DB session.
        if db is None or impact is None:
            return ValidationResult(allowed=True, requires_approval=False, approver_role=None, checks=[])
        resource = (await db.execute(select(Resource).where(Resource.id == resource_id))).scalar_one_or_none()
        if resource is None:
            return ValidationResult(
                allowed=False,
                requires_approval=False,
                approver_role=None,
                checks=[ValidationCheck(name="POLICY", passed=False, message="Resource not found.")],
            )
        checks = await self._policy_checks(db, resource, action, impact)
        checks.extend(await self._budget_checks(db, resource, impact))
        return ValidationResult(
            allowed=all(c.passed for c in checks),
            requires_approval=False,
            approver_role=None,
            checks=checks,
        )

    async def validate(
        self,
        db: AsyncSession,
        *,
        resource: Resource,
        action: ProposedAction,
        impact: MoneyImpact,
        requester_role: str,
    ) -> ValidationResult:
        checks: list[ValidationCheck] = [
            ValidationCheck(
                name="PERMISSION",
                passed="actions.request" in permissions_for(requester_role),
                message=(
                    "You can request scaling actions."
                    if "actions.request" in permissions_for(requester_role)
                    else "Your role cannot request actions."
                ),
            )
        ]
        checks.extend(await self._policy_checks(db, resource, action, impact))
        checks.extend(await self._budget_checks(db, resource, impact))

        requires_approval = False
        approver_role: str | None = None
        approval_checks: list[ValidationCheck] = []
        policies = (
            await db.execute(
                select(Policy)
                .where(Policy.enabled.is_(True), Policy.type == "APPROVAL_RULE")
                .order_by(Policy.priority.asc(), Policy.created_at.asc())
            )
        ).scalars().all()
        for policy in policies:
            if not _scope_matches(policy.scope or {}, resource):
                continue
            rules = policy.rules or {}
            trigger = rules.get("requireApprovalWhen") or {}
            cost_match = (
                "costDeltaMonthlyUsdGt" in trigger
                and impact.delta_monthly_usd > float(trigger["costDeltaMonthlyUsdGt"])
            )
            type_match = action.type.value in (trigger.get("actionTypeIn") or [])
            if not (cost_match or type_match):
                continue
            candidate = str(rules.get("approverRole", "MANAGER"))
            if candidate not in ROLE_ORDER:
                continue
            requires_approval = True
            if approver_role is None or ROLE_ORDER[candidate] > ROLE_ORDER[approver_role]:
                approver_role = candidate

        if requires_approval and approver_role:
            if role_at_least(requester_role, approver_role):
                approval_checks.append(
                    ValidationCheck(
                        name="APPROVAL",
                        passed=True,
                        message="You are authorized to approve this yourself.",
                    )
                )
                requires_approval = False
            else:
                approval_checks.append(
                    ValidationCheck(
                        name="APPROVAL",
                        passed=True,
                        message=f"Cost increase of ${money(impact.delta_monthly_usd):.2f}/month needs {approver_role.title()} approval.",
                    )
                )
        else:
            approval_checks.append(
                ValidationCheck(name="APPROVAL", passed=True, message="No approval rule matched this action.")
            )
        checks.extend(approval_checks)
        return ValidationResult(
            allowed=all(c.passed for c in checks),
            requires_approval=requires_approval,
            approver_role=approver_role,
            checks=checks,
        )

    async def _policy_checks(self, db, resource: Resource, action: ProposedAction, impact: MoneyImpact):
        checks: list[ValidationCheck] = []
        target = _target_value(resource, action)
        if isinstance(target, (int, float)):
            if target < 1:
                checks.append(ValidationCheck(name="POLICY", passed=False, message="Target quantity must be at least 1."))
            if action.type.value in {"SCALE_OUT", "SCALE_IN"}:
                if target < resource.min_quantity:
                    checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Target is below the minimum of {resource.min_quantity}."))
                if target > resource.max_quantity:
                    checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Target exceeds the maximum of {resource.max_quantity}."))
        policies = (
            await db.execute(
                select(Policy)
                .where(Policy.enabled.is_(True), Policy.type == "SAFETY_LIMIT")
                .order_by(Policy.priority.asc(), Policy.created_at.asc())
            )
        ).scalars().all()
        for policy in policies:
            if not _scope_matches(policy.scope or {}, resource):
                continue
            rules = policy.rules or {}
            if "blockedActions" in rules and action.type.value in (rules.get("blockedActions") or []):
                checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Action {action.type.value} is blocked by policy '{policy.name}'."))
            if isinstance(target, (int, float)) and action.type.value in {"SCALE_OUT", "SCALE_IN"}:
                if "maxInstances" in rules and target > int(rules["maxInstances"]):
                    checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Scaling to {int(target)} instances exceeds the safety limit of {int(rules['maxInstances'])}."))
                if "minInstances" in rules and target < int(rules["minInstances"]):
                    checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Scaling below {int(rules['minInstances'])} instances is not allowed."))
                if "maxScaleStepPercent" in rules and resource.quantity:
                    step_pct = abs(float(target) - resource.quantity) / resource.quantity * 100
                    if step_pct > float(rules["maxScaleStepPercent"]):
                        checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Scale step of {step_pct:.1f}% exceeds the {float(rules['maxScaleStepPercent']):.1f}% limit."))
            if "maxCostIncreasePerActionUsd" in rules and impact.delta_monthly_usd > float(rules["maxCostIncreasePerActionUsd"]):
                checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Monthly cost increase of ${money(impact.delta_monthly_usd):.2f} exceeds the ${money(rules['maxCostIncreasePerActionUsd']):.2f} safety limit."))
            if "allowedWindows" in rules and not _in_allowed_window(rules.get("allowedWindows") or [], utcnow()):
                checks.append(ValidationCheck(name="POLICY", passed=False, message=f"Action is outside the allowed window defined by policy '{policy.name}'."))
        if not any(c.name == "POLICY" for c in checks):
            checks.append(ValidationCheck(name="POLICY", passed=True, message="Action is within the configured safety limits."))
        return checks

    async def _budget_checks(self, db, resource: Resource, impact: MoneyImpact):
        checks: list[ValidationCheck] = []
        budgets = (await db.execute(select(Budget).order_by(Budget.created_at.asc()))).scalars().all()
        matched = [b for b in budgets if _budget_matches(b, resource)]
        if not matched:
            return [ValidationCheck(name="BUDGET", passed=True, message="No matching budget applies to this resource.")]
        for budget in matched:
            usage = await use("cost_engine").budget_usage(db, budget.id)
            used = float(usage.used_usd or 0)
            after = used + max(float(impact.delta_monthly_usd), 0.0)
            limit = float(budget.amount_usd)
            if budget.hard_limit and after > limit:
                checks.append(ValidationCheck(name="BUDGET", passed=False, message=f"Budget '{budget.name}' would be exceeded: ${after:.2f} > ${limit:.2f}."))
            elif after > limit:
                checks.append(ValidationCheck(name="BUDGET", passed=True, message=f"Warning: budget '{budget.name}' would be exceeded: ${after:.2f} > ${limit:.2f}."))
            else:
                checks.append(ValidationCheck(name="BUDGET", passed=True, message=f"Stays within the {budget.name} budget."))
        return checks


def _scope_matches(scope: dict[str, Any], resource: Resource) -> bool:
    if not scope:
        return True
    if scope.get("provider") and scope["provider"] != resource.provider:
        return False
    if scope.get("resourceType") and scope["resourceType"] != resource.type:
        return False
    if scope.get("accountId") and str(scope["accountId"]) != str(resource.cloud_account_id):
        return False
    tags = scope.get("tags") or {}
    resource_tags = resource.tags or {}
    return all(str(resource_tags.get(k)) == str(v) for k, v in tags.items())


def _budget_matches(budget: Budget, resource: Resource) -> bool:
    if budget.scope == "GLOBAL":
        return True
    if budget.scope == "PROVIDER":
        return str(budget.scope_value).upper() == str(resource.provider).upper()
    if budget.scope == "ACCOUNT":
        return str(budget.scope_value) == str(resource.cloud_account_id)
    if budget.scope == "TAG":
        if not budget.scope_value or ":" not in budget.scope_value:
            return False
        key, value = budget.scope_value.split(":", 1)
        return str((resource.tags or {}).get(key)) == value
    return False


def _target_value(resource: Resource, action: ProposedAction):
    p = action.params
    if action.type.value in {"SCALE_OUT", "SCALE_IN"}:
        return p.target_instances
    if action.type.value == "RESIZE":
        return p.target_size
    if action.type.value == "EXPAND_STORAGE":
        return p.target_storage_gb
    if action.type.value in {"START", "STOP"}:
        return action.type.value
    return None


def _in_allowed_window(windows: list[dict], now: datetime) -> bool:
    if not windows:
        return False
    for w in windows:
        try:
            local = now.astimezone(ZoneInfo(w["timezone"]))
        except (KeyError, ZoneInfoNotFoundError):
            continue
        if local.weekday() not in w.get("days", []):
            continue
        hour = local.hour
        start = int(w["startHour"])
        end = int(w["endHour"])
        if start <= end and start <= hour < end:
            return True
        if start > end and (hour >= start or hour < end):
            return True
    return False


engine = PolicyEngine()

from app.ports import provide
provide("policy_engine", engine)
