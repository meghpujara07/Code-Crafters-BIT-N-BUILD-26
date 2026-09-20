"""Resource schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.3 and §6.4.
"""

from typing import Optional, Any
from app.schemas.base import CamelModel


class ResourceLatest(CamelModel):
    cpu_utilization: Optional[float] = None
    memory_utilization: Optional[float] = None
    request_rate: Optional[float] = None
    latency_p95_ms: Optional[float] = None
    error_rate: Optional[float] = None
    storage_utilization: Optional[float] = None


class Resource(CamelModel):
    id: str
    account_id: str
    provider: str  # 'AWS' | 'AZURE' | 'GCP'
    external_id: str
    name: str
    type: str  # 'COMPUTE' | 'DATABASE' | 'STORAGE' | 'LOAD_BALANCER' | 'CONTAINER'
    region: str
    status: str  # 'RUNNING' | 'STOPPED' | 'PROVISIONING' | 'ERROR'
    health: str  # 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN'
    size: str
    quantity: int
    min_quantity: int
    max_quantity: int
    supported_actions: list[str]
    storage_gb: Optional[float] = None
    monthly_cost_usd: float
    tags: dict[str, str] = {}
    latest: ResourceLatest
    last_seen_at: str


class ResourcePatch(CamelModel):
    tags: Optional[dict[str, str]] = None
    min_quantity: Optional[int] = None
    max_quantity: Optional[int] = None


class ResourceHealthCheck(CamelModel):
    name: str
    status: str  # 'PASS' | 'WARN' | 'FAIL'
    message: str


class ResourceHealthDetail(CamelModel):
    health: str
    uptime_percent: float
    last_incident_at: Optional[str] = None
    checks: list[ResourceHealthCheck] = []


class ResourceCostDailyItem(CamelModel):
    date: str
    amount_usd: float


class ResourceCost(CamelModel):
    month_to_date_usd: float
    forecast_usd: float
    daily_costs: list[ResourceCostDailyItem] = []
