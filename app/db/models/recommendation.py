from uuid import uuid4
from sqlalchemy import DateTime, Integer, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class Recommendation(Base):
    __tablename__='recommendations'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); resource_id: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('resources.id',ondelete='CASCADE')); type: Mapped[str]=mapped_column(String(30)); status: Mapped[str]=mapped_column(String(20)); title: Mapped[str]=mapped_column(String(255)); summary: Mapped[str]=mapped_column(Text); confidence: Mapped[int]=mapped_column(Integer); severity: Mapped[str]=mapped_column(String(20)); reason: Mapped[list]=mapped_column(JSONB); proposed_action: Mapped[dict]=mapped_column(JSONB); cost_impact: Mapped[dict]=mapped_column(JSONB); expires_at: Mapped[object]=mapped_column(DateTime(timezone=True)); dismissed_at: Mapped[object|None]=mapped_column(DateTime(timezone=True)); dismissed_by: Mapped[object|None]=mapped_column(UUID(as_uuid=True)); created_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
