"""Dashboard schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.4.
"""

from app.schemas.base import CamelModel


class ResourceBreakdown(CamelModel):
    total: int
    by_health: dict[str, int]
    by_provider: dict[str, int]


class TrafficOverview(CamelModel):
    request_rate: float
    change_percent: float


class LatencyOverview(CamelModel):
    p95_ms: float
    change_percent: float


class UptimeOverview(CamelModel):
    percent: float


class StorageOverview(CamelModel):
    used_gb: float
    total_gb: float
    utilization_percent: float


class CostOverview(CamelModel):
    month_to_date_usd: float
    forecast_end_of_month_usd: float
    budget_usd: float
    budget_used_percent: float


class DashboardCounts(CamelModel):
    open_alerts: int
    new_recommendations: int
    pending_approvals: int


class DashboardOverview(CamelModel):
    resources: ResourceBreakdown
    traffic: TrafficOverview
    latency: LatencyOverview
    uptime: UptimeOverview
    storage: StorageOverview
    cost: CostOverview
    counts: DashboardCounts
