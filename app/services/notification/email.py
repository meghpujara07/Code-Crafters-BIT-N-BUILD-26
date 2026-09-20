import asyncio,logging
from app.core.config import settings
from app.services.notification.base import NotificationChannel
log=logging.getLogger(__name__)
class EmailChannel(NotificationChannel):
    channel='EMAIL'
    async def send(self,user,title,body,destination,db,entity_type=None,entity_id=None):
        if not settings.smtp_host or not destination: log.info('email notification logged for %s: SMTP credentials/destination not configured',user.email); return 'LOGGED'
        async def sendmail():
            import aiosmtplib
            from email.message import EmailMessage
            msg=EmailMessage(); msg['From']=settings.smtp_from or settings.smtp_user; msg['To']=destination; msg['Subject']=title; msg.set_content(body)
            await aiosmtplib.send(msg,hostname=settings.smtp_host,port=settings.smtp_port,username=settings.smtp_user,password=settings.smtp_password,start_tls=True)
        try: await asyncio.wait_for(sendmail(),timeout=10); return 'SENT'
        except Exception as exc: log.exception('email notification failed: %s',exc); return 'FAILED'
