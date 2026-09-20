from uuid import uuid4
from sqlalchemy import DateTime, String, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class Action(Base):
    __tablename__='actions'; __table_args__=(UniqueConstraint('requested_by','idempotency_key',name='uq_actions_idempotency'), Index('uq_actions_resource_inflight','resource_id',unique=True,postgresql_where=__import__('sqlalchemy').text("status IN ('PENDING_APPROVAL','APPROVED','EXECUTING')")),)
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); resource_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('resources.id',ondelete='SET NULL')); resource_name: Mapped[str]=mapped_column(String(255)); recommendation_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('recommendations.id',ondelete='SET NULL')); type: Mapped[str]=mapped_column(String(30)); params: Mapped[dict]=mapped_column(JSONB); status: Mapped[str]=mapped_column(String(30)); requested_by: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('users.id')); approved_by: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('users.id')); validation: Mapped[dict]=mapped_column(JSONB); cost_impact: Mapped[dict]=mapped_column(JSONB); provider_operation_id: Mapped[str|None]=mapped_column(String(255)); result: Mapped[dict|None]=mapped_column(JSONB); error: Mapped[str|None]=mapped_column(Text); idempotency_key: Mapped[str]=mapped_column(String(255)); executed_at: Mapped[object|None]=mapped_column(DateTime(timezone=True)); created_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
