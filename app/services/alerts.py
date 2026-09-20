from sqlalchemy import select
from app.db.models import Alert
from app.ports import provide,use
from app.core.util import utcnow
class Alerts:
 async def raise_alert(self,db,*,severity,source,title,message,resource_id=None,anomaly_id=None):
    q=select(Alert).where(Alert.source==source,Alert.title==title,Alert.status=='OPEN')
    if resource_id is None: q=q.where(Alert.resource_id.is_(None))
    else: q=q.where(Alert.resource_id==resource_id)
    if (await db.execute(q)).scalar_one_or_none(): return None
    a=Alert(severity=severity,source=source,title=title,message=message,resource_id=resource_id,anomaly_id=anomaly_id,status='OPEN',created_at=utcnow()); db.add(a); await db.flush()
    await use('notifier').notify_event(db,'ALERT_CREATED',title=title,body=message,entity_type='ALERT',entity_id=str(a.id))
    data={'id':str(a.id),'severity':a.severity,'title':a.title,'message':a.message,'source':a.source,'resourceId':str(a.resource_id) if a.resource_id else None,'status':a.status,'createdAt':a.created_at.isoformat().replace('+00:00','Z')}
    await use('hub').publish('alert.created','alerts',data); return a.id
 async def resolve_alerts(self,db,*,anomaly_id=None,resource_id=None,source=None):
    q=select(Alert).where(Alert.status=='OPEN')
    if anomaly_id is not None: q=q.where(Alert.anomaly_id==anomaly_id)
    if resource_id is not None: q=q.where(Alert.resource_id==resource_id)
    if source is not None: q=q.where(Alert.source==source)
    rows=(await db.execute(q)).scalars().all()
    for a in rows:
        a.status='RESOLVED'; data={'id':str(a.id),'severity':a.severity,'title':a.title,'message':a.message,'source':a.source,'resourceId':str(a.resource_id) if a.resource_id else None,'status':a.status,'createdAt':a.created_at.isoformat().replace('+00:00','Z')}; await use('hub').publish('alert.resolved','alerts',data)
    await db.commit(); return len(rows)
provide('alerts',Alerts())
