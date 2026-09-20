from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Body, Depends, Header, Query
from sqlalchemy import func, select

from app.core.deps import get_db, require
from app.core.errors import ApiError
from app.core.util import iso
from app.db.models import Action, Resource, User
from app.schemas.common import ActionParams, ProposedAction
from app.schemas.enums import ActionType
from app.services.orchestrator import action_out, approve_action, cancel_action, create_action, reject_action
from app.ports import use

router = APIRouter(tags=["actions"])


@router.post("/actions/preview")
async def preview_action(body: dict = Body(...), db=Depends(get_db), actor: User = Depends(require("actions.request"))):
    resource_id = _uuid(body.get("resourceId"), "resourceId")
    action_type = _enum(body.get("type"), ActionType, "type")
    resource = (await db.execute(select(Resource).where(Resource.id == resource_id))).scalar_one_or_none()
    if not resource:
        raise ApiError(404, "NOT_FOUND", "Resource not found.")
    params = ActionParams.model_validate(body.get("params") or {})
    # Reuse structural rules without creating an Action. In-flight is intentionally ignored.
    from app.services.orchestrator import _structural
    _structural(resource, action_type.value, params)
    proposed = ProposedAction(type=action_type, params=params)
    impact = await use("cost_engine").estimate_impact(db, resource.id, proposed)
    validation = await use("policy_engine").validate(db, resource=resource, action=proposed, impact=impact, requester_role=actor.role)
    return {"success": True, "data": {"costImpact": impact.model_dump(mode="json", by_alias=True), "validation": validation.model_dump(mode="json", by_alias=True)}}


@router.post("/actions", status_code=201)
async def create(body: dict = Body(...), idempotency_key: str | None = Header(None, alias="Idempotency-Key"), db=Depends(get_db), actor: User = Depends(require("actions.request"))):
    action = await create_action(db, actor=actor, resource_id=_uuid(body.get("resourceId"), "resourceId"), action_type=_enum(body.get("type"), ActionType, "type").value, params=body.get("params") or {}, idempotency_key=idempotency_key or "", recommendation_id=_optional_uuid(body.get("recommendationId")))
    return {"success": True, "data": action_out(action, actor)}


@router.get("/actions")
async def list_actions(status: str | None = None, resource_id: UUID | None = Query(None, alias="resourceId"), requested_by: UUID | None = Query(None, alias="requestedBy"), page: int = 1, page_size: int = Query(20, alias="pageSize"), db=Depends(get_db), actor: User = Depends(require("actions.read"))):
    if page < 1 or page_size < 1 or page_size > 100:
        raise ApiError(400, "VALIDATION_ERROR", "Invalid pagination.")
    stmt = select(Action)
    if status: stmt = stmt.where(Action.status == status)
    if resource_id: stmt = stmt.where(Action.resource_id == resource_id)
    if requested_by: stmt = stmt.where(Action.requested_by == requested_by)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(stmt.order_by(Action.created_at.desc()).offset((page-1)*page_size).limit(page_size))).scalars().all()
    users = {}
    if rows:
        ids={x.requested_by for x in rows} | {x.approved_by for x in rows if x.approved_by}
        users={u.id:u for u in (await db.execute(select(User).where(User.id.in_(ids)))).scalars().all()}
    data=[action_out(x,users.get(x.requested_by),users.get(x.approved_by)) for x in rows]
    return {"success":True,"data":data,"meta":{"page":page,"pageSize":page_size,"total":total,"totalPages":(total+page_size-1)//page_size}}


@router.get("/actions/{action_id}")
async def get_action(action_id: UUID, db=Depends(get_db), actor: User = Depends(require("actions.read"))):
    action=(await db.execute(select(Action).where(Action.id==action_id))).scalar_one_or_none()
    if not action: raise ApiError(404,"NOT_FOUND","Action not found.")
    users=(await db.execute(select(User).where(User.id.in_({action.requested_by, action.approved_by} - {None})))).scalars().all()
    by={u.id:u for u in users}
    return {"success":True,"data":action_out(action,by.get(action.requested_by),by.get(action.approved_by))}


@router.post("/actions/{action_id}/approve")
async def approve(action_id: UUID, body: dict = Body(default={}), db=Depends(get_db), actor: User = Depends(require("actions.approve"))):
    action=await _get(db,action_id)
    action=await approve_action(db,action=action,approver=actor,comment=body.get("comment") if isinstance(body,dict) else None)
    return {"success":True,"data":action_out(action,actor,actor)}


@router.post("/actions/{action_id}/reject")
async def reject(action_id: UUID, body: dict = Body(...), db=Depends(get_db), actor: User = Depends(require("actions.approve"))):
    if not isinstance(body,dict) or not isinstance(body.get("reason"),str) or not body["reason"].strip():
        raise ApiError(400,"VALIDATION_ERROR","reason is required.")
    action=await reject_action(db,action=await _get(db,action_id),actor=actor,reason=body["reason"].strip())
    return {"success":True,"data":action_out(action,actor)}


@router.post("/actions/{action_id}/cancel")
async def cancel(action_id: UUID, db=Depends(get_db), actor: User = Depends(require("actions.request"))):
    action=await cancel_action(db,action=await _get(db,action_id),actor=actor)
    return {"success":True,"data":action_out(action,actor)}


async def _get(db, action_id):
    action=(await db.execute(select(Action).where(Action.id==action_id))).scalar_one_or_none()
    if not action: raise ApiError(404,"NOT_FOUND","Action not found.")
    return action

def _uuid(value,field):
    try: return UUID(str(value))
    except Exception as exc: raise ApiError(400,"VALIDATION_ERROR",f"{field} must be a UUID.") from exc

def _optional_uuid(value):
    if value is None: return None
    return _uuid(value,"recommendationId")

def _enum(value, enum_cls, field):
    try: return enum_cls(value)
    except Exception as exc: raise ApiError(400,"VALIDATION_ERROR",f"Invalid {field}.") from exc
