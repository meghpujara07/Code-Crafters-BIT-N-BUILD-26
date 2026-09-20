import logging
from uuid import UUID
from sqlalchemy import select
from app.db.models import User,NotificationSetting,Action
from app.core.rbac import roles_with_permission,role_at_least
from app.core.util import utcnow
from app.ports import provide
from app.services.notification.in_app import InAppChannel
from app.services.notification.email import EmailChannel
from app.services.notification.whatsapp import WhatsAppChannel
log=logging.getLogger(__name__)
CHANNELS={'IN_APP':InAppChannel(),'EMAIL':EmailChannel(),'WHATSAPP':WhatsAppChannel()}
class Notifier:
 async def notify_event(self,db,event,*,title,body,entity_type=None,entity_id=None):
    recipients=[]
    if event=='ALERT_CREATED': roles=roles_with_permission('metrics.read'); recipients=(await db.execute(select(User).where(User.active.is_(True),User.role.in_(roles)))).scalars().all()
    elif event=='RECOMMENDATION_CREATED': roles=roles_with_permission('actions.request'); recipients=(await db.execute(select(User).where(User.active.is_(True),User.role.in_(roles)))).scalars().all()
    elif event in ('APPROVAL_REQUESTED','ACTION_COMPLETED','ACTION_FAILED'):
        try: aid=UUID(entity_id) if entity_id else None
        except Exception: aid=None
        action=(await db.execute(select(Action).where(Action.id==aid))).scalar_one_or_none() if aid else None
        if not action: log.warning('no recipients: action entity missing'); return
        if event=='APPROVAL_REQUESTED':
            approver=(action.validation or {}).get('approverRole')
            roles=roles_with_permission('actions.approve'); recipients=[u for u in (await db.execute(select(User).where(User.active.is_(True),User.role.in_(roles)))).scalars().all() if approver and role_at_least(u.role,approver)]
        else:
            ids={action.requested_by};
            if action.approved_by: ids.add(action.approved_by)
            recipients=(await db.execute(select(User).where(User.id.in_(ids),User.active.is_(True)))).scalars().all()
    elif event in ('BUDGET_THRESHOLD','COST_ANOMALY'):
        roles=roles_with_permission('budgets.write'); recipients=(await db.execute(select(User).where(User.active.is_(True),User.role.in_(roles)))).scalars().all()
    if not recipients: return
    for user in recipients:
        settings=(await db.execute(select(NotificationSetting).where(NotificationSetting.user_id==user.id))).scalars().all()
        by={s.channel:s for s in settings}
        for ch,channel in CHANNELS.items():
            s=by.get(ch)
            enabled=bool(s and s.enabled and event in (s.events or []))
            if ch!='IN_APP': enabled=enabled and bool(s.destination)
            if not enabled: continue
            status=await channel.send(user,title,body,s.destination if s else None,db,entity_type,UUID(entity_id) if entity_id else None)
            if ch!='IN_APP':
                from app.db.models import Notification
                db.add(Notification(user_id=user.id,channel=ch,title=title,body=body,entity_type=entity_type,entity_id=UUID(entity_id) if entity_id else None,sent_at=utcnow(),delivery_status=status))
    await db.commit()
provide('notifier',Notifier())
