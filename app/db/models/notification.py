from uuid import uuid4
from sqlalchemy import Boolean, DateTime, String, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class Alert(Base):
    __tablename__='alerts'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); severity: Mapped[str]=mapped_column(String(20)); source: Mapped[str]=mapped_column(String(30)); title: Mapped[str]=mapped_column(String(255)); message: Mapped[str]=mapped_column(Text); resource_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('resources.id',ondelete='SET NULL')); anomaly_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True)); status: Mapped[str]=mapped_column(String(20)); created_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
class Notification(Base):
    __tablename__='notifications'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); user_id: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('users.id',ondelete='CASCADE')); channel: Mapped[str]=mapped_column(String(20)); title: Mapped[str]=mapped_column(String(255)); body: Mapped[str]=mapped_column(Text); entity_type: Mapped[str|None]=mapped_column(String(50)); entity_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True)); read_at: Mapped[object|None]=mapped_column(DateTime(timezone=True)); sent_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow); delivery_status: Mapped[str]=mapped_column(String(20),default='SENT')
class NotificationSetting(Base):
    __tablename__='notification_settings'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); user_id: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('users.id',ondelete='CASCADE')); channel: Mapped[str]=mapped_column(String(20)); enabled: Mapped[bool]=mapped_column(Boolean,default=True); events: Mapped[list[str]]=mapped_column(ARRAY(String)); destination: Mapped[str|None]=mapped_column(String(255))
