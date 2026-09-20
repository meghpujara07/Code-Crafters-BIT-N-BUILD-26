from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.core.errors import ApiError
from app.db.models import Action, Budget, Policy, Resource, User
from app.schemas.common import MoneyImpact, ValidationCheck, ValidationResult
from app.schemas.enums import ActionType
from app.services import orchestrator
from app.services.policy import PolicyEngine


class Result:
    def __init__(self, scalar=None, scalars=None):
        self._scalar = scalar
        self._scalars = scalars or []
    def scalar_one_or_none(self): return self._scalar
    def scalar_one(self): return self._scalar
    def scalars(self): return self
    def all(self): return self._scalars
    def first(self): return self._scalars[0] if self._scalars else None


class FakeDB:
    def __init__(self, resource, policies=None, budgets=None):
        self.resource = resource
        self.policies = policies or []
        self.budgets = budgets or []
        self.actions = []
        self.calls = 0
    async def execute(self, stmt):
        entity = stmt.column_descriptions[0].get("entity")
        if entity is Action:
            # create_action does idempotency lookup first, then in-flight lookup.
            if self.calls == 0:
                self.calls += 1
                return Result(None)
            self.calls += 1
            return Result(None, [])
        if entity is Resource:
            return Result(self.resource)
        if entity is Policy:
            return Result(None, self.policies)
        if entity is Budget:
            return Result(None, self.budgets)
        raise AssertionError(entity)
    def add(self, obj):
        if isinstance(obj, Action): self.actions.append(obj)
    async def flush(self):
        if self.actions:
            self.actions[-1].id = self.actions[-1].id or uuid4()
            self.actions[-1].created_at = self.actions[-1].created_at or datetime.now(timezone.utc)
    async def commit(self): pass
    async def rollback(self): pass


@pytest.mark.asyncio
async def test_policy_engine_blocks_safety_limit_and_allows_safe_action(monkeypatch):
    resource = SimpleNamespace(id=uuid4(), provider="AWS", type="COMPUTE", cloud_account_id=uuid4(), quantity=6, min_quantity=2, max_quantity=10, tags={})
    policy = SimpleNamespace(name="Global safety", scope={}, rules={"maxInstances": 10, "maxCostIncreasePerActionUsd": 500}, enabled=True, type="SAFETY_LIMIT")
    db = FakeDB(resource, policies=[policy], budgets=[])
    impact = MoneyImpact(current_monthly_cost_usd=121.47, projected_monthly_cost_usd=182.21, delta_monthly_usd=60.74, delta_percent=50, budget=None)
    action = SimpleNamespace(type=ActionType.SCALE_OUT, params=SimpleNamespace(target_instances=12, target_size=None, target_storage_gb=None))
    result = await PolicyEngine().check_limits(db, resource.id, action, impact)
    assert result.allowed is False
    assert any("safety limit" in c.message for c in result.checks if not c.passed)


@pytest.mark.asyncio
async def test_create_action_produces_blocked_for_rule_failure(monkeypatch):
    resource = SimpleNamespace(id=uuid4(), name="checkout-api", external_id="checkout", cloud_account_id=uuid4(), supported_actions=["SCALE_OUT"], quantity=6, min_quantity=2, max_quantity=10, size="t3.medium", storage_gb=None, status="RUNNING")
    actor = SimpleNamespace(id=uuid4(), name="Dev Ops", role="DEVOPS")
    db = FakeDB(resource)
    impact = MoneyImpact(current_monthly_cost_usd=121.47, projected_monthly_cost_usd=364.41, delta_monthly_usd=242.94, delta_percent=200, budget=None)
    validation = ValidationResult(allowed=False, requires_approval=False, approver_role=None, checks=[ValidationCheck(name="POLICY", passed=False, message="Scaling to 12 instances exceeds the safety limit of 10.")])

    class Cost:
        async def estimate_impact(self, *args): return impact
    class Policy:
        async def validate(self, *args, **kwargs): return validation
    class Audit:
        async def write(self, *args, **kwargs): return None
    def fake_use(name):
        if name == "cost_engine": return Cost()
        if name == "policy_engine": return Policy()
        return Audit()
    monkeypatch.setattr(orchestrator, "use", fake_use)
    monkeypatch.setattr(orchestrator.asyncio, "create_task", lambda coro: coro.close())
    action = await orchestrator.create_action(db, actor=actor, resource_id=resource.id, action_type="SCALE_OUT", params={"targetInstances": 12}, idempotency_key=str(uuid4()))
    assert action.status == "BLOCKED"
    assert action.validation["allowed"] is False


def test_structural_validation_rejects_noop_and_unsupported():
    resource = SimpleNamespace(supported_actions=["SCALE_OUT"], quantity=4, min_quantity=2, max_quantity=10, size="t3.medium", storage_gb=None, status="RUNNING")
    params = SimpleNamespace(target_instances=4, target_size=None, target_storage_gb=None)
    with pytest.raises(ApiError) as exc:
        orchestrator._structural(resource, "SCALE_OUT", params)
    assert exc.value.status == 400 and exc.value.code == "VALIDATION_ERROR"

    with pytest.raises(ApiError) as exc:
        orchestrator._structural(resource, "STOP", params)
    assert exc.value.status == 400
