import logging
import httpx
from app.core.config import settings
from app.services.notification.base import NotificationChannel
log=logging.getLogger(__name__)
class WhatsAppChannel(NotificationChannel):
    channel='WHATSAPP'
    async def send(self,user,title,body,destination,db,entity_type=None,entity_id=None):
        if not settings.whatsapp_token or not settings.whatsapp_phone_number_id or not destination: log.info('whatsapp notification logged for %s: credentials/destination not configured',user.email); return 'LOGGED'
        try:
            url=f'https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages'
            async with httpx.AsyncClient(timeout=10) as client:
                r=await client.post(url,headers={'Authorization':f'Bearer {settings.whatsapp_token}'},json={'messaging_product':'whatsapp','to':destination,'type':'text','text':{'body':f'{title}\n{body}'}}); r.raise_for_status()
            return 'SENT'
        except Exception as exc: log.exception('whatsapp notification failed: %s',exc); return 'FAILED'
