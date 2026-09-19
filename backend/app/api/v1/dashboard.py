"""Dashboard API Router for Person 3.

Endpoint: GET /dashboard/overview
Conforms to ARCHITECTURE.md §7.2.
"""

from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.base import ApiResponse
from app.schemas.dashboard import (
    DashboardOverview,
    ResourceBreakdown,
    TrafficOverview,
    LatencyOverview,
    UptimeOverview,
    StorageOverview,
    CostOverview,
    DashboardCounts,
)

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview", response_model=ApiResponse[DashboardOverview])
async def get_dashboard_overview(
    provider: Optional[str] = Query(None, description="Filter by cloud provider"),
) -> ApiResponse[DashboardOverview]:
    """Get dashboard overview KPIs, counts, and summaries."""
    data = DashboardOverview(
        resources=ResourceBreakdown(
            total=14,
            by_health={"HEALTHY": 11, "DEGRADED": 2, "UNHEALTHY": 1, "UNKNOWN": 0},
            by_provider={"AWS": 6, "AZURE": 4, "GCP": 4},
        ),
        traffic=TrafficOverview(request_rate=1840.5, change_percent=62.3),
        latency=LatencyOverview(p95_ms=312.0, change_percent=18.4),
        uptime=UptimeOverview(percent=99.95),
        storage=StorageOverview(used_gb=6860.0, total_gb=9800.0, utilization_percent=70.0),
        cost=CostOverview(
            month_to_date_usd=1879.42,
            forecast_end_of_month_usd=2968.10,
            budget_usd=3500.0,
            budget_used_percent=53.7,
        ),
        counts=DashboardCounts(open_alerts=3, new_recommendations=5, pending_approvals=2),
    )
    return ApiResponse(data=data)
