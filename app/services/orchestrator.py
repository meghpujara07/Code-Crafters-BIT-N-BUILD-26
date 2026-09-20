from __future__ import annotations

import asyncio
import logging
from datetime import timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.errors import ApiError
from app.core.rbac import role_at_least
from app.core.util import iso, utcnow
from app.db.models import Action, CloudAccount, Resource, User
from app.ports import use
from app.schemas.common import ActionParams, ProposedAction, ValidationResult
from app.schemas.enums import ActionStatus, ActionType

log = logging.getLogger(__name__)

_IN_FLIGHT = {"PENDING_APPROVAL", "APPROVED", "EXECUTING"}


def _params_for(action_type: str, params: dict) -> ActionParams:
    allowed = {"targetInstances", "targetSize", "targetStorageGb"}
    unknown = set(params) - allowed
    if unknown:
        raise ApiError(400, "VALIDATION_ERROR", "Unknown action parameter(s).", [{"field": f"params.{k}", "reason": "unsupported"} for k in sorted(unknown)])
    try:
        return ActionParams.model_validate(params)
    except Exception as exc:
        raise ApiError(400, "VALIDATION_ERROR", "Invalid action parameters.", []) from exc


def _target(action_type: str, params: ActionParams):
    if action_type in {"SCALE_OUT", "SCALE_IN"}:
        return params.target_instances
    if action_type == "RESIZE":
        return params.target_size
    if action_type == "EXPAND_STORAGE":
        return params.target_storage_gb
    return action_type


def _structural(resource: Resource, action_type: str, params: ActionParams) -> None:
    if action_type not in {x for x in (resource.supported_actions or [])}:
        raise ApiError(400, "VALIDATION_ERROR", f"Action {action_type} is not supported by this resource.")
    required = {
        "SCALE_OUT": params.target_instances,
        "SCALE_IN": params.target_instances,
        "RESIZE": params.target_size,
        "EXPAND_STORAGE": params.target_storage_gb,
    }
    if action_type in required and required[action_type] is None:
        raise ApiError(400, "VALIDATION_ERROR", f"params for {action_type} are required.")
    if action_type in {"SCALE_OUT", "SCALE_IN"} and isinstance(params.target_instances, bool):
        raise ApiError(400, "VALIDATION_ERROR", "targetInstances must be an integer.")
    if action_type == "EXPAND_STORAGE" and float(params.target_storage_gb or 0) <= 0:
        raise ApiError(400, "VALIDATION_ERROR", "targetStorageGb must be positive.")
    if action_type == "SCALE_OUT" and params.target_instances <= resource.quantity:
        raise ApiError(400, "VALIDATION_ERROR", "SCALE_OUT target must be greater than the current quantity.")
    if action_type == "SCALE_IN" and params.target_instances >= resource.quantity:
        raise ApiError(400, "VALIDATION_ERROR", "SCALE_IN target must be lower than the current quantity.")
    if action_type == "RESIZE" and params.target_size == resource.size:
        raise ApiError(400, "VALIDATION_ERROR", "Target size is the current size.")
    if action_type == "EXPAND_STORAGE" and params.target_storage_gb == resource.storage_gb:
        raise ApiError(400, "VALIDATION_ERROR", "Target storage is the current storage.")
    if action_type == "STOP" and str(resource.status).upper() == "STOPPED":
        raise ApiError(400, "VALIDATION_ERROR", "Resource is already stopped.")
    if action_type == "START" and str(resource.status).upper() in {"RUNNING", "ACTIVE"}:
        raise ApiError(400, "VALIDATION_ERROR", "Resource is already running.")


def _dict(model):
    return model.model_dump(mode="json", by_alias=True)


def action_out(action: Action, requester: User | None = None, approver: User | None = None) -> dict:
    return {
        "id": str(action.id),
        "resourceId": str(action.resource_id) if action.resource_id else None,
        "resourceName": action.resource_name,
        "recommendationId": str(action.recommendation_id) if action.recommendation_id else None,
        "type": action.type,
        "params": action.params or {},
        "status": action.status,
        "requestedBy": {"id": str(requester.id), "name": requester.name} if requester else {"id": str(action.requested_by), "name": "Unknown"},
        "approvedBy": {"id": str(approver.id), "name": approver.name} if approver else None,
        "validation": action.validation,
        "costImpact": action.cost_impact,
        "result": action.result,
        "error": action.error,
        "createdAt": iso(action.created_at),
        "executedAt": iso(action.executed_at),
    }


async def create_action(db, *, actor: User, resource_id: UUID, action_type: str, params: dict, idempotency_key: str, recommendation_id: UUID | None = None) -> Action:
    if not idempotency_key or not idempotency_key.strip():
        raise ApiError(400, "VALIDATION_ERROR", "Idempotency-Key header is required.")
    existing = (await db.execute(select(Action).where(Action.requested_by == actor.id, Action.idempotency_key == idempotency_key))).scalar_one_or_none()
    if existing:
        return existing

    resource = (await db.execute(select(Resource).where(Resource.id == resource_id))).scalar_one_or_none()
    if not resource:
        raise ApiError(404, "NOT_FOUND", "Resource not found.")
    action_type = str(action_type)
    try:
        ActionType(action_type)
    except ValueError as exc:
        raise ApiError(400, "VALIDATION_ERROR", "Unsupported action type.") from exc
    p = _params_for(action_type, params)
    _structural(resource, action_type, p)
    proposed = ProposedAction(type=ActionType(action_type), params=p)
    impact = await use("cost_engine").estimate_impact(db, resource.id, proposed)
    validation = await use("policy_engine").validate(db, resource=resource, action=proposed, impact=impact, requester_role=actor.role)

    in_flight = (await db.execute(select(Action).where(Action.resource_id == resource.id, Action.status.in_(_IN_FLIGHT)))).scalars().first()
    if in_flight:
        raise ApiError(409, "CONFLICT", "Another action is already in progress for this resource.")

    status = ActionStatus.BLOCKED.value if not validation.allowed else (
        ActionStatus.PENDING_APPROVAL.value if validation.requires_approval else ActionStatus.APPROVED.value
    )
    action = Action(
        resource_id=resource.id,
        resource_name=resource.name,
        recommendation_id=recommendation_id,
        type=action_type,
        params=_dict(p),
        status=status,
        requested_by=actor.id,
        approved_by=None,
        validation=_dict(validation),
        cost_impact=_dict(impact),
        idempotency_key=idempotency_key,
    )
    db.add(action)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        existing = (await db.execute(select(Action).where(Action.requested_by == actor.id, Action.idempotency_key == idempotency_key))).scalar_one_or_none()
        if existing:
            return existing
        raise ApiError(409, "CONFLICT", "Another action is already in progress for this resource.") from exc
    await _audit(db, actor.id, "CREATE_ACTION", action, None)
    await db.commit()

    if status == ActionStatus.PENDING_APPROVAL.value:
        await _notify(db, "APPROVAL_REQUESTED", action, "Approval required", f"{resource.name} requires approval for {action_type}.")
    elif status == ActionStatus.APPROVED.value:
        action.status = ActionStatus.EXECUTING.value
        await _audit(db, actor.id, "EXECUTE_ACTION", action, ActionStatus.APPROVED.value)
        await db.commit()
        asyncio.create_task(_execute_action(action.id))
    return action


async def approve_action(db, *, action: Action, approver: User, comment: str | None = None) -> Action:
    if action.status != ActionStatus.PENDING_APPROVAL.value:
        raise ApiError(409, "CONFLICT", "Only pending actions can be approved.")
    validation = action.validation or {}
    required_role = validation.get("approverRole")
    if required_role and not role_at_least(approver.role, required_role):
        raise ApiError(403, "FORBIDDEN", "Insufficient approval role.")
    resource = (await db.execute(select(Resource).where(Resource.id == action.resource_id))).scalar_one_or_none()
    if not resource:
        action.status = ActionStatus.BLOCKED.value
        action.error = "Resource no longer exists."
        await db.commit()
        raise ApiError(422, "POLICY_VIOLATION", action.error)
    requester = (await db.execute(select(User).where(User.id == action.requested_by))).scalar_one_or_none()
    requester_role = requester.role if requester else approver.role
    proposed = ProposedAction(type=ActionType(action.type), params=ActionParams.model_validate(action.params or {}))
    impact = await use("cost_engine").estimate_impact(db, resource.id, proposed)
    revalidated = await use("policy_engine").validate(db, resource=resource, action=proposed, impact=impact, requester_role=requester_role)
    if not revalidated.allowed:
        action.status = ActionStatus.BLOCKED.value
        action.validation = _dict(revalidated)
        action.cost_impact = _dict(impact)
        action.error = _first_failed_message(revalidated)
        await _audit(db, approver.id, "BLOCK_ACTION_ON_APPROVE", action, ActionStatus.PENDING_APPROVAL.value)
        await db.commit()
        code = "BUDGET_EXCEEDED" if any(c["name"] == "BUDGET" and not c["passed"] for c in action.validation.get("checks", [])) else "POLICY_VIOLATION"
        raise ApiError(422, code, action.error)
    action.approved_by = approver.id
    action.validation = _dict(revalidated)
    action.cost_impact = _dict(impact)
    action.status = ActionStatus.APPROVED.value
    await _audit(db, approver.id, "APPROVE_ACTION", action, ActionStatus.PENDING_APPROVAL.value)
    await db.commit()
    action.status = ActionStatus.EXECUTING.value
    await _audit(db, approver.id, "EXECUTE_ACTION", action, ActionStatus.APPROVED.value)
    await db.commit()
    asyncio.create_task(_execute_action(action.id))
    return action


async def reject_action(db, *, action: Action, actor: User, reason: str) -> Action:
    if action.status != ActionStatus.PENDING_APPROVAL.value:
        raise ApiError(409, "CONFLICT", "Only pending actions can be rejected.")
    action.status = ActionStatus.REJECTED.value
    action.error = reason
    await _audit(db, actor.id, "REJECT_ACTION", action, ActionStatus.PENDING_APPROVAL.value)
    await db.commit()
    return action


async def cancel_action(db, *, action: Action, actor: User) -> Action:
    if action.requested_by != actor.id:
        raise ApiError(403, "FORBIDDEN", "Only the requester can cancel this action.")
    if action.status != ActionStatus.PENDING_APPROVAL.value:
        raise ApiError(409, "CONFLICT", "Only pending actions can be cancelled.")
    action.status = ActionStatus.CANCELLED.value
    await _audit(db, actor.id, "CANCEL_ACTION", action, ActionStatus.PENDING_APPROVAL.value)
    await db.commit()
    return action


async def _execute_action(action_id: UUID):
    from app.db.session import async_session
    async with async_session() as db:
        action = (await db.execute(select(Action).where(Action.id == action_id))).scalar_one_or_none()
        if not action or action.status != ActionStatus.EXECUTING.value:
            return
        resource = (await db.execute(select(Resource).where(Resource.id == action.resource_id))).scalar_one_or_none()
        if not resource:
            action.status = ActionStatus.FAILED.value
            action.error = "Resource not found during execution."
            action.executed_at = utcnow()
            await db.commit()
            return
        account = (await db.execute(select(CloudAccount).where(CloudAccount.id == resource.cloud_account_id))).scalar_one_or_none()
        if not account:
            await _finish(db, action, ActionStatus.FAILED.value, error="Cloud account not found.")
            return
        try:
            adapter = use("adapters").get(account)
            operation = await adapter.execute(account, resource.external_id, action.type, action.params or {})
            action.provider_operation_id = operation.operation_id
            await db.commit()
            deadline = utcnow() + timedelta(minutes=5)
            current = operation
            while current.state == "RUNNING" and utcnow() < deadline:
                await asyncio.sleep(3)
                async with async_session() as poll_db:
                    fresh = (await poll_db.execute(select(Action).where(Action.id == action_id))).scalar_one_or_none()
                    if not fresh or fresh.status != ActionStatus.EXECUTING.value:
                        return
                    acc = (await poll_db.execute(select(CloudAccount).where(CloudAccount.id == resource.cloud_account_id))).scalar_one_or_none()
                    current = await adapter.get_operation_status(acc, operation.operation_id)
                    if current.state == "RUNNING":
                        continue
                    await _finish(poll_db, fresh, ActionStatus.SUCCEEDED.value if current.state == "SUCCEEDED" else ActionStatus.FAILED.value, result={"message": current.message} if current.message else None, error=None if current.state == "SUCCEEDED" else (current.message or "Provider operation failed."))
                    return
            if current.state == "RUNNING":
                await _finish(db, action, ActionStatus.FAILED.value, error="Provider operation timed out after 5 minutes.")
        except Exception as exc:
            log.exception("action execution failed")
            await _finish(db, action, ActionStatus.FAILED.value, error=str(exc))


async def _finish(db, action: Action, status: str, *, result: dict | None = None, error: str | None = None):
    before = action.status
    action.status = status
    action.result = result
    action.error = error
    action.executed_at = utcnow()
    await db.commit()
    if status == ActionStatus.SUCCEEDED.value:
        try:
            await use("ingestion").refresh_resource(action.resource_id)
        except Exception:
            log.exception("resource refresh failed after action %s", action.id)
    await _audit(db, action.requested_by, f"ACTION_{status}", action, before)
    event = "ACTION_COMPLETED" if status == ActionStatus.SUCCEEDED.value else "ACTION_FAILED"
    await _notify(db, event, action, f"Action {status.lower()}", error or (result or {}).get("message", "Action completed."))
    try:
        await use("hub").publish("action.status_changed", "actions", {"actionId": str(action.id), "status": status, "message": error or (result or {}).get("message", "Action completed.")})
    except Exception:
        log.exception("WS publish failed")


async def _audit(db, actor_id, event: str, action: Action, before):
    after = {
        "id": str(action.id) if action.id else None,
        "status": action.status,
        "type": action.type,
        "resourceId": str(action.resource_id) if action.resource_id else None,
    }
    await use("audit").write(db, actor_id=actor_id, action=event, entity_type="ACTION", entity_id=action.id, before={"status": before} if before else None, after=after)


async def _notify(db, event: str, action: Action, title: str, body: str):
    try:
        await use("notifier").notify_event(db, event, title=title, body=body, entity_type="ACTION", entity_id=str(action.id))
    except Exception:
        log.exception("notification failed for action %s", action.id)


def _first_failed_message(validation: ValidationResult) -> str:
    for check in validation.checks:
        if not check.passed:
            return check.message
    return "Action failed validation."
