from __future__ import annotations

from uuid import UUID
from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import func, select

from app.core.deps import get_db, require
from app.core.errors import ApiError
from app.core.util import iso, utcnow
from app.core.rbac import permissions_for
from app.db.models import Recommendation, Resource, User
from app.ports import use
from app.schemas.common import ActionParams, ProposedAction
from app.schemas.enums import ActionType, RecommendationStatus
from app.services.orchestrator import action_out, create_action

router=APIRouter(tags=["recommendations"])


def _out(rec, resource, policy_check):
    return {"id":str(rec.id),"resourceId":str(rec.resource_id),"resourceName":resource.name,"provider":resource.provider,"type":rec.type,"status":rec.status,"title":rec.title,"summary":rec.summary,"confidence":rec.confidence,"severity":rec.severity,"reason":rec.reason or [],"proposedAction":rec.proposed_action,"costImpact":rec.cost_impact,"policyCheck":policy_check.model_dump(mode="json",by_alias=True),"createdAt":iso(rec.created_at),"expiresAt":iso(rec.expires_at)}

async def _policy_for(db, user, resource, rec):
    try:
        proposed=ProposedAction(type=ActionType(rec.proposed_action["type"]),params=ActionParams.model_validate(rec.proposed_action.get("params") or {}))
        impact=await use("cost_engine").estimate_impact(db,resource.id,proposed)
        return await use("policy_engine").validate(db,resource=resource,action=proposed,impact=impact,requester_role=user.role)
    except Exception:
        from app.schemas.common import ValidationResult, ValidationCheck
        return ValidationResult(allowed=False,requires_approval=False,approver_role=None,checks=[ValidationCheck(name="POLICY",passed=False,message="Recommendation policy check is unavailable.")])

@router.get("/recommendations")
async def list_recommendations(status:str|None=None,type:str|None=None,resource_id:UUID|None=Query(None,alias="resourceId"),provider:str|None=None,page:int=1,page_size:int=Query(20,alias="pageSize"),db=Depends(get_db),user:User=Depends(require("recommendations.read"))):
    if page<1 or page_size<1 or page_size>100: raise ApiError(400,"VALIDATION_ERROR","Invalid pagination.")
    stmt=select(Recommendation)
    if status: stmt=stmt.where(Recommendation.status==status)
    if type: stmt=stmt.where(Recommendation.type==type)
    if resource_id: stmt=stmt.where(Recommendation.resource_id==resource_id)
    if provider: stmt=stmt.join(Resource,Resource.id==Recommendation.resource_id).where(Resource.provider==provider)
    total=(await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows=(await db.execute(stmt.order_by(Recommendation.created_at.desc()).offset((page-1)*page_size).limit(page_size))).scalars().all()
    resources={r.id:r for r in (await db.execute(select(Resource).where(Resource.id.in_([x.resource_id for x in rows])))).scalars().all()} if rows else {}
    data=[_out(r,resources[r.resource_id],await _policy_for(db,user,resources[r.resource_id],r)) for r in rows]
    return {"success":True,"data":data,"meta":{"page":page,"pageSize":page_size,"total":total,"totalPages":(total+page_size-1)//page_size}}

@router.get("/recommendations/{recommendation_id}")
async def get_recommendation(recommendation_id:UUID,db=Depends(get_db),user:User=Depends(require("recommendations.read"))):
    rec=(await db.execute(select(Recommendation).where(Recommendation.id==recommendation_id))).scalar_one_or_none()
    if not rec: raise ApiError(404,"NOT_FOUND","Recommendation not found.")
    resource=(await db.execute(select(Resource).where(Resource.id==rec.resource_id))).scalar_one_or_none()
    if not resource: raise ApiError(404,"NOT_FOUND","Resource not found.")
    return {"success":True,"data":_out(rec,resource,await _policy_for(db,user,resource,rec))}

@router.post("/recommendations/{recommendation_id}/accept",status_code=201)
async def accept(recommendation_id:UUID,db=Depends(get_db),user:User=Depends(require("actions.request"))):
    rec=(await db.execute(select(Recommendation).where(Recommendation.id==recommendation_id))).scalar_one_or_none()
    if not rec: raise ApiError(404,"NOT_FOUND","Recommendation not found.")
    if rec.status!="NEW" or rec.expires_at<=utcnow(): raise ApiError(409,"CONFLICT","Recommendation is no longer actionable.")
    resource=(await db.execute(select(Resource).where(Resource.id==rec.resource_id))).scalar_one_or_none()
    if not resource: raise ApiError(404,"NOT_FOUND","Resource not found.")
    proposed=rec.proposed_action or {}
    action=await create_action(db,actor=user,resource_id=resource.id,action_type=proposed.get("type"),params=proposed.get("params") or {},idempotency_key=f"recommendation:{rec.id}",recommendation_id=rec.id)
    if action.status!="BLOCKED":
        rec.status="ACCEPTED"
        await db.commit()
    return {"success":True,"data":action_out(action,user)}

@router.post("/recommendations/{recommendation_id}/dismiss")
async def dismiss(recommendation_id:UUID,body:dict=Body(default={}),db=Depends(get_db),user:User=Depends(require("actions.request"))):
    rec=(await db.execute(select(Recommendation).where(Recommendation.id==recommendation_id))).scalar_one_or_none()
    if not rec: raise ApiError(404,"NOT_FOUND","Recommendation not found.")
    if rec.status!="NEW": raise ApiError(409,"CONFLICT","Only NEW recommendations can be dismissed.")
    rec.status="DISMISSED"; rec.dismissed_at=utcnow(); rec.dismissed_by=user.id
    await db.commit()
    return {"success":True,"data":{"id":str(rec.id),"status":rec.status}}
