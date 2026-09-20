from uuid import UUID
from fastapi import APIRouter,Depends,Query
from sqlalchemy import select,update
from app.core.deps import get_db,current_user
from app.core.pagination import page_params,paginate
from app.core.errors import ApiError
from app.core.util import iso,utcnow
from app.db.models import Notification,NotificationSetting
from app.schemas.base import ApiResponse,PagedResponse
from app.schemas.notifications import NotificationOut,NotificationSettingOut,NotificationSettingsBody,NotificationTest
from app.ports import use
router=APIRouter(tags=['notifications'])
def out(n): return NotificationOut(id=str(n.id),channel=n.channel,title=n.title,body=n.body,entity_type=n.entity_type,entity_id=str(n.entity_id) if n.entity_id else None,read_at=iso(n.read_at),created_at=iso(n.sent_at))
@router.get('/notifications',response_model=PagedResponse[NotificationOut])
async def list_notifications(unread:bool=False,p=Depends(page_params),user=Depends(current_user),db=Depends(get_db)):
    q=select(Notification).where(Notification.user_id==user.id,Notification.channel=='IN_APP').order_by(Notification.sent_at.desc())
    if unread:q=q.where(Notification.read_at.is_(None))
    rows,meta=await paginate(db,q,p); return {'success':True,'data':[out(x) for x in rows],'meta':meta}
@router.post('/notifications/{id}/read',response_model=ApiResponse[NotificationOut])
async def read(id:UUID,user=Depends(current_user),db=Depends(get_db)):
    n=(await db.execute(select(Notification).where(Notification.id==id,Notification.user_id==user.id))).scalar_one_or_none()
    if not n: raise ApiError(404,'NOT_FOUND','Notification not found')
    n.read_at=utcnow(); await db.commit(); return {'success':True,'data':out(n)}
@router.post('/notifications/read-all',response_model=ApiResponse[dict])
async def read_all(user=Depends(current_user),db=Depends(get_db)):
    result=await db.execute(update(Notification).where(Notification.user_id==user.id,Notification.channel=='IN_APP',Notification.read_at.is_(None)).values(read_at=utcnow())); await db.commit(); return {'success':True,'data':{'updated':result.rowcount}}
@router.get('/notification-settings',response_model=ApiResponse[list[NotificationSettingOut]])
async def settings_get(user=Depends(current_user),db=Depends(get_db)):
    rows=(await db.execute(select(NotificationSetting).where(NotificationSetting.user_id==user.id))).scalars().all(); return {'success':True,'data':[NotificationSettingOut(channel=x.channel,enabled=x.enabled,events=x.events,destination=x.destination) for x in rows]}
@router.put('/notification-settings',response_model=ApiResponse[list[NotificationSettingOut]])
async def settings_put(body:NotificationSettingsBody,user=Depends(current_user),db=Depends(get_db)):
    existing={x.channel:x for x in (await db.execute(select(NotificationSetting).where(NotificationSetting.user_id==user.id))).scalars().all()}
    for s in body.settings:
        row=existing.get(s.channel)
        if row: row.enabled=s.enabled; row.events=[e.value if hasattr(e,'value') else e for e in s.events]; row.destination=s.destination
        else: db.add(NotificationSetting(user_id=user.id,channel=s.channel,enabled=s.enabled,events=[e.value if hasattr(e,'value') else e for e in s.events],destination=s.destination))
    await db.commit(); return await settings_get(user,db)
@router.post('/notification-settings/test',response_model=ApiResponse[dict])
async def settings_test(body:NotificationTest,user=Depends(current_user),db=Depends(get_db)):
    rows=(await db.execute(select(NotificationSetting).where(NotificationSetting.user_id==user.id,NotificationSetting.channel==body.channel.value))).scalars().all()
    if not rows: raise ApiError(400,'VALIDATION_ERROR','Channel is not configured')
    s=rows[0]; from app.services.notification.in_app import InAppChannel
    channel={'IN_APP':__import__('app.services.notification.in_app',fromlist=['InAppChannel']).InAppChannel(),'EMAIL':__import__('app.services.notification.email',fromlist=['EmailChannel']).EmailChannel(),'WHATSAPP':__import__('app.services.notification.whatsapp',fromlist=['WhatsAppChannel']).WhatsAppChannel()}[body.channel.value]
    await channel.send(user,'CloudOps test notification','This is a CloudOps notification test.',s.destination,db); await db.commit(); return {'success':True,'data':{'sent':True}}
