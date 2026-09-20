from uuid import UUID
from fastapi import APIRouter,Depends,Query
from sqlalchemy import select
from app.core.deps import get_db,require
from app.core.errors import ApiError
from app.core.pagination import page_params,paginate
from app.core.util import iso
from app.db.models import Alert
from app.schemas.base import ApiResponse,PagedResponse
from app.schemas.alerts import AlertOut
from app.ports import use
router=APIRouter(tags=['alerts'])
def out(a): return AlertOut(id=str(a.id),severity=a.severity,title=a.title,message=a.message,source=a.source,resource_id=str(a.resource_id) if a.resource_id else None,status=a.status,created_at=iso(a.created_at))
@router.get('/alerts',response_model=PagedResponse[AlertOut])
async def list_alerts(status:str|None=None,severity:str|None=None,p=Depends(page_params),user=Depends(require('metrics.read')),db=Depends(get_db)):
    q=select(Alert).order_by(Alert.created_at.desc())
    if status:q=q.where(Alert.status==status)
    if severity:q=q.where(Alert.severity==severity)
    rows,meta=await paginate(db,q,p); return {'success':True,'data':[out(x) for x in rows],'meta':meta}
async def mutate(id:UUID,new_status:str,user,db):
    a=(await db.execute(select(Alert).where(Alert.id==id))).scalar_one_or_none()
    if not a: raise ApiError(404,'NOT_FOUND','Alert not found')
    if a.status=='RESOLVED': raise ApiError(409,'CONFLICT','Alert already resolved')
    a.status=new_status; await db.commit(); return {'success':True,'data':out(a)}
@router.post('/alerts/{id}/acknowledge',response_model=ApiResponse[AlertOut])
async def acknowledge(id:UUID,user=Depends(require('actions.request')),db=Depends(get_db)): return await mutate(id,'ACKNOWLEDGED',user,db)
@router.post('/alerts/{id}/resolve',response_model=ApiResponse[AlertOut])
async def resolve(id:UUID,user=Depends(require('actions.request')),db=Depends(get_db)): return await mutate(id,'RESOLVED',user,db)
