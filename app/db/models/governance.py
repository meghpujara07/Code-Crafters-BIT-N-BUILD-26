from uuid import uuid4
from sqlalchemy import Boolean, Integer, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.util import utcnow
class Policy(Base):
    __tablename__='policies'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); name: Mapped[str]=mapped_column(String(255)); type: Mapped[str]=mapped_column(String(30)); enabled: Mapped[bool]=mapped_column(Boolean,default=True); priority: Mapped[int]=mapped_column(Integer); scope: Mapped[dict]=mapped_column(JSONB); rules: Mapped[dict]=mapped_column(JSONB); created_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
class Budget(Base):
    __tablename__='budgets'
    id: Mapped[object]=mapped_column(UUID(as_uuid=True),primary_key=True,default=uuid4); name: Mapped[str]=mapped_column(String(255)); scope: Mapped[str]=mapped_column(String(30)); scope_value: Mapped[str|None]=mapped_column(String(255)); amount_usd: Mapped[float]=mapped_column(Numeric(14,2)); period: Mapped[str]=mapped_column(String(20)); alert_thresholds: Mapped[list[int]]=mapped_column(ARRAY(Integer)); hard_limit: Mapped[bool]=mapped_column(Boolean,default=False); created_at: Mapped[object]=mapped_column(DateTime(timezone=True),default=utcnow)
