from uuid import uuid4
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class AiConversation(Base):
    __tablename__='ai_conversations'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); user_id: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('users.id',ondelete='CASCADE')); messages: Mapped[list]=mapped_column(JSONB); created_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
