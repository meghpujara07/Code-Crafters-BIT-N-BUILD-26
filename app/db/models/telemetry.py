from datetime import date
from uuid import uuid4
from sqlalchemy import Date, DateTime, Float, Integer, Numeric, String, ForeignKey, PrimaryKeyConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class Metric(Base):
    __tablename__='metrics'; __table_args__=(PrimaryKeyConstraint('resource_id','metric','ts'),)
    resource_id: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('resources.id',ondelete='CASCADE')); metric: Mapped[str]=mapped_column(String(100)); ts: Mapped[object]=mapped_column(DateTime(timezone=True)); value: Mapped[float]=mapped_column(Float)
class Cost(Base):
    __tablename__='costs'; __table_args__=(UniqueConstraint('cloud_account_id','resource_id','service','usage_date',name='uq_costs'),)
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); cloud_account_id: Mapped[object]=mapped_column(UUID(as_uuid=True),ForeignKey('cloud_accounts.id',ondelete='CASCADE')); resource_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('resources.id',ondelete='SET NULL')); provider: Mapped[str]=mapped_column(String(20)); service: Mapped[str]=mapped_column(String(100)); usage_date: Mapped[date]=mapped_column(Date); amount_usd: Mapped[float]=mapped_column(Numeric(14,2)); tags: Mapped[dict]=mapped_column(JSONB,default=dict)
class PriceCatalog(Base):
    __tablename__='price_catalog'; __table_args__=(UniqueConstraint('provider','region','resource_type','size',name='uq_price_catalog_unique'),)
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); provider: Mapped[str]=mapped_column(String(20)); region: Mapped[str]=mapped_column(String(100)); resource_type: Mapped[str]=mapped_column(String(50)); size: Mapped[str]=mapped_column(String(100)); vcpu: Mapped[int|None]=mapped_column(Integer); memory_gb: Mapped[float|None]=mapped_column(Float); hourly_price_usd: Mapped[float]=mapped_column(Numeric(14,6))
class Anomaly(Base):
    __tablename__='anomalies'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); kind: Mapped[str]=mapped_column(String(30)); resource_id: Mapped[object|None]=mapped_column(UUID(as_uuid=True),ForeignKey('resources.id',ondelete='SET NULL')); severity: Mapped[str]=mapped_column(String(20)); metric: Mapped[str]=mapped_column(String(100)); expected_value: Mapped[float]=mapped_column(Float); observed_value: Mapped[float]=mapped_column(Float); detected_at: Mapped[object]=mapped_column(DateTime(timezone=True)); status: Mapped[str]=mapped_column(String(20))
