import logging
from app.db.models import AuditLog
from app.ports import provide
log=logging.getLogger(__name__)
class Audit:
 async def write(self,db,*,actor_id,action,entity_type,entity_id,before=None,after=None):
    try:
        db.add(AuditLog(actor_id=actor_id,action=action,entity_type=entity_type,entity_id=entity_id,before=before,after=after,ip='0.0.0.0')); await db.commit()
    except Exception as exc:
        await db.rollback(); log.exception('audit write failed: %s',exc)
provide('audit',Audit())
