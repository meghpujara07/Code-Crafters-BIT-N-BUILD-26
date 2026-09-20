from app.services.notification.base import NotificationChannel
from app.db.models import Notification
from app.core.util import utcnow
from app.realtime.hub import hub
class InAppChannel(NotificationChannel):
    channel='IN_APP'
    async def send(self,user,title,body,destination,db,entity_type=None,entity_id=None):
        n=Notification(user_id=user.id,channel='IN_APP',title=title,body=body,entity_type=entity_type,entity_id=entity_id,read_at=None,sent_at=utcnow(),delivery_status='SENT'); db.add(n); await db.flush()
        await hub.publish_user(user.id,'notification.created',{'id':str(n.id),'channel':'IN_APP','title':title,'body':body,'entityType':entity_type,'entityId':str(entity_id) if entity_id else None,'readAt':None,'createdAt':utcnow().isoformat().replace('+00:00','Z')})
        return 'SENT'
