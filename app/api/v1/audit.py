from fastapi import APIRouter,Depends,Query
from sqlalchemy import select
from app.core.deps import get_db,require
from app.core.pagination import page_params,paginate
from app.core.util import iso
from app.db.models import AuditLog,User
from app.schemas.base import PagedResponse
from app.schemas.audit import AuditOut,AuditActor
router=APIRouter(tags=['audit'])
@router.get('/audit-logs',response_model=PagedResponse[AuditOut])
async def audit_logs(actor_id:str|None=Query(None,alias='actorId'),entity_type:str|None=Query(None,alias='entityType'),from_:str|None=Query(None,alias='from'),to:str|None=Query(None,alias='to'),p=Depends(page_params),user=Depends(require('audit.read')),db=Depends(get_db)):
    q=select(AuditLog,User).outerjoin(User,User.id==AuditLog.actor_id).order_by(AuditLog.ts.desc())
    if actor_id:q=q.where(AuditLog.actor_id==actor_id)
    if entity_type:q=q.where(AuditLog.entity_type==entity_type)
    rows,meta=await paginate(db,q,p)
    # paginate on joined tuples is not supported by scalar helper; use a direct conversion fallback
    result=(await db.execute(q.offset((p.page-1)*p.page_size).limit(p.page_size))).all()
    data=[AuditOut(id=str(a.id),actor=AuditActor(id=str(u.id),name=u.name) if u else None,action=a.action,entity_type=a.entity_type,entity_id=str(a.entity_id) if a.entity_id else None,before=a.before,after=a.after,ts=iso(a.ts)) for a,u in result]
    return {'success':True,'data':data,'meta':meta}
