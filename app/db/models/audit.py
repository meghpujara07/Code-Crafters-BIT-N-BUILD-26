from uuid import uuid4
from sqlalchemy import DateTime, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class AuditLog(Base):
    __tablename__='audit_logs'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); actor_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('users.id')); action: Mapped[str]=mapped_column(String(100)); entity_type: Mapped[str]=mapped_column(String(50)); entity_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True)); before: Mapped[dict|None]=mapped_column(JSONB); after: Mapped[dict|None]=mapped_column(JSONB); ip: Mapped[str|None]=mapped_column(String(45)); ts: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
