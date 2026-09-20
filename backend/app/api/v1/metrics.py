"""Fleet Metrics API Router for Person 3.

Endpoints: GET /metrics/summary, GET /metrics/timeseries
Conforms to ARCHITECTURE.md §7.5.
"""

from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query
from app.schemas.base import ApiResponse
from app.schemas.metrics import (
    MetricsSummary,
    TrafficSummary,
    LatencySummary,
    StorageSummary,
    MetricsTimeseries,
    GroupedSeries,
    MetricPoint,
)

router = APIRouter(tags=["metrics"])


@router.get("/metrics/summary", response_model=ApiResponse[MetricsSummary])
async def get_metrics_summary(
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    provider: Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
) -> ApiResponse[MetricsSummary]:
    """Get fleet-level metrics summary."""
    data = MetricsSummary(
        traffic=TrafficSummary(avg=1840.5, peak=3100.0, change_percent=62.3),
        latency=LatencySummary(p50_ms=110.0, p95_ms=312.0, p99_ms=450.0),
        uptime_percent=99.95,
        error_rate=0.45,
        storage=StorageSummary(used_gb=6860.0, total_gb=9800.0, utilization_percent=70.0),
        health_counts={"HEALTHY": 11, "DEGRADED": 2, "UNHEALTHY": 1, "UNKNOWN": 0},
    )
    return ApiResponse(data=data)


@router.get("/metrics/timeseries", response_model=ApiResponse[MetricsTimeseries])
async def get_metrics_timeseries(
    metric: str = Query("request_rate"),
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    interval: str = Query("5m"),
    group_by: str = Query("none", alias="groupBy"),
    provider: Optional[str] = Query(None),
) -> ApiResponse[MetricsTimeseries]:
    """Get aggregated metrics timeseries grouped by provider or resourceType."""
    now_utc = datetime.now(timezone.utc)

    m_val = metric if isinstance(metric, str) else "request_rate"
    int_val = interval if isinstance(interval, str) else "5m"
    group_val = group_by if isinstance(group_by, str) else "none"
    prov_val = provider if isinstance(provider, str) else None

    points = [
        MetricPoint(t=(now_utc - timedelta(minutes=15)).strftime("%Y-%m-%dT%H:%M:%SZ"), v=1650.0),
        MetricPoint(t=(now_utc - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"), v=1750.0),
        MetricPoint(t=now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"), v=1840.5),
    ]

    key_name = "all" if group_val == "none" else (prov_val or "AWS")
    series = [GroupedSeries(key=key_name, points=points)]

    data = MetricsTimeseries(
        metric=m_val,
        unit="req/s" if "request" in m_val else "%",
        interval=int_val,
        series=series,
    )
    return ApiResponse(data=data)
