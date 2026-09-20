from uuid import uuid4
from sqlalchemy import DateTime, ForeignKey, Integer, Float, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class Resource(Base):
    __tablename__='resources'; __table_args__=(UniqueConstraint('cloud_account_id','external_id',name='uq_resources_account_external'),)
    id: Mapped[object] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    cloud_account_id: Mapped[object] = mapped_column(UUID(as_uuid=True), ForeignKey('cloud_accounts.id',ondelete='CASCADE'),nullable=False)
    provider: Mapped[str]=mapped_column(String(20),nullable=False); external_id: Mapped[str]=mapped_column(String(255),nullable=False); name: Mapped[str]=mapped_column(String(255),nullable=False)
    type: Mapped[str]=mapped_column(String(30),nullable=False); region: Mapped[str]=mapped_column(String(100),nullable=False); status: Mapped[str]=mapped_column(String(30),nullable=False); health: Mapped[str]=mapped_column(String(30),nullable=False)
    size: Mapped[str]=mapped_column(String(100),nullable=False); quantity: Mapped[int]=mapped_column(Integer,nullable=False); min_quantity: Mapped[int]=mapped_column(Integer,nullable=False); max_quantity: Mapped[int]=mapped_column(Integer,nullable=False)
    supported_actions: Mapped[list[str]]=mapped_column(ARRAY(String),nullable=False); storage_gb: Mapped[float|None]=mapped_column(Float); monthly_cost_usd: Mapped[float]=mapped_column(Float,nullable=False)
    tags: Mapped[dict]=mapped_column(JSONB,nullable=False,default=dict); metadata_json: Mapped[dict]=mapped_column('metadata',JSONB,nullable=False,default=dict); last_seen_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow,nullable=False)
