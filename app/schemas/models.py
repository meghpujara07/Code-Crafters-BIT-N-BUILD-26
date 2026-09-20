# app/schemas/models.py
"""Pydantic schemas mirroring the SQLAlchemy ORM models.

All schemas inherit from :class:`CamelModel` to provide camelCase JSON keys.
Only the fields required for API contracts are included; additional fields can be
added later as needed.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
import uuid

from .base import CamelModel

# ---------------------------------------------------------------------------
# Users and authentication
# ---------------------------------------------------------------------------

class User(CamelModel):
    id: uuid.UUID
    email: str
    hashed_password: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class RefreshToken(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    jti: str
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    created_at: datetime

# ---------------------------------------------------------------------------
# Cloud accounts and resources
# ---------------------------------------------------------------------------

class CloudAccount(CamelModel):
    id: uuid.UUID
    provider: str
    name: str
    external_account_id: str
    regions: List[str]
    mode: str
    status: str
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class Resource(CamelModel):
    id: uuid.UUID
    cloud_account_id: uuid.UUID
    provider: str
    external_id: str
    name: str
    type: str
    region: str
    status: str
    health: str
    size: Optional[str] = None
    quantity: int
    min_quantity: int
    max_quantity: int
    supported_actions: List[str]
    storage_gb: Optional[float] = None
    monthly_cost_usd: float
    tags: Optional[dict] = None
    metadata: Optional[dict] = None
    last_seen_at: datetime
    created_at: datetime
    updated_at: datetime

class Metric(CamelModel):
    resource_id: uuid.UUID
    metric: str
    ts: datetime
    value: float

# ---------------------------------------------------------------------------
# Cost and pricing tables
# ---------------------------------------------------------------------------

class Cost(CamelModel):
    id: uuid.UUID
    cloud_account_id: uuid.UUID
    resource_id: Optional[uuid.UUID] = None
    provider: str
    service: str
    usage_date: date
    amount_usd: float
    tags: Optional[dict] = None

class PriceCatalog(CamelModel):
    id: uuid.UUID
    provider: str
    region: str
    resource_type: str
    size: str
    vcpu: Optional[int] = None
    memory_gb: Optional[float] = None
    hourly_price_usd: float

# ---------------------------------------------------------------------------
# Anomalies, recommendations, policies, budgets, actions
# ---------------------------------------------------------------------------

class Anomaly(CamelModel):
    id: uuid.UUID
    kind: str
    resource_id: Optional[uuid.UUID] = None
    severity: str
    metric: str
    expected_value: float
    observed_value: float
    detected_at: datetime
    status: str

class Recommendation(CamelModel):
    id: uuid.UUID
    resource_id: uuid.UUID
    type: str
    status: str
    title: str
    summary: str
    confidence: int
    severity: str
    reason: dict
    proposed_action: dict
    cost_impact: dict
    expires_at: datetime
    dismissed_at: Optional[datetime] = None
    dismissed_by: Optional[uuid.UUID] = None
    created_at: datetime

class Policy(CamelModel):
    id: uuid.UUID
    name: str
    type: str
    enabled: bool
    priority: int
    scope: dict
    rules: dict
    created_at: datetime

class Budget(CamelModel):
    id: uuid.UUID
    name: str
    scope: str
    scope_value: Optional[str] = None
    amount_usd: float
    period: str
    alert_thresholds: List[int]
    hard_limit: bool
    created_at: datetime

class Action(CamelModel):
    id: uuid.UUID
    resource_id: Optional[uuid.UUID] = None
    resource_name: str
    recommendation_id: Optional[uuid.UUID] = None
    type: str
    params: dict
    status: str
    requested_by: uuid.UUID
    approved_by: Optional[uuid.UUID] = None
    validation: dict
    cost_impact: dict
    provider_operation_id: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None
    idempotency_key: str
    executed_at: Optional[datetime] = None
    created_at: datetime

class Alert(CamelModel):
    id: uuid.UUID
    severity: str
    source: str
    title: str
    message: str
    resource_id: Optional[uuid.UUID] = None
    anomaly_id: Optional[uuid.UUID] = None
    status: str
    created_at: datetime

class Notification(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    channel: str
    title: str
    body: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    read_at: Optional[datetime] = None
    sent_at: datetime

class NotificationSetting(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    channel: str
    enabled: bool
    events: List[str]
    destination: Optional[str] = None

class AuditLog(CamelModel):
    id: uuid.UUID
    actor_id: Optional[uuid.UUID] = None
    action: str
    entity_type: str
    entity_id: Optional[uuid.UUID] = None
    before: Optional[dict] = None
    after: Optional[dict] = None
    ip: str
    ts: datetime

class AIConversation(CamelModel):
    id: uuid.UUID
    user_id: uuid.UUID
    messages: List[dict]
    created_at: datetime
