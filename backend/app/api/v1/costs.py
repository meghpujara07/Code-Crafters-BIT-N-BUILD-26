"""Costs & Billing API Router for Person 3.

Endpoints: GET /costs/summary, /timeseries, /breakdown, /forecast
Conforms to ARCHITECTURE.md §7.6.
"""

from typing import Optional
from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Query
from app.schemas.base import ApiResponse
from app.schemas.costs import (
    CostSummary,
    CostTimeseries,
    CostBreakdownItem,
    CostForecast,
    CostForecastPoint,
)
from app.schemas.metrics import GroupedSeries, MetricPoint

router = APIRouter(tags=["costs"])


@router.get("/costs/summary", response_model=ApiResponse[CostSummary])
async def get_costs_summary(
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    provider: Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
) -> ApiResponse[CostSummary]:
    """Get cost summary KPIs."""
    data = CostSummary(
        month_to_date_usd=1879.42,
        forecast_end_of_month_usd=2968.10,
        last_month_usd=2810.00,
        change_percent=5.6,
        budget_usd=3500.0,
        budget_used_percent=53.7,
        currency="USD",
    )
    return ApiResponse(data=data)


@router.get("/costs/timeseries", response_model=ApiResponse[CostTimeseries])
async def get_costs_timeseries(
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    interval: str = Query("1d"),
    group_by: str = Query("none", alias="groupBy"),
) -> ApiResponse[CostTimeseries]:
    """Get daily cost timeseries."""
    today = date.today()
    int_val = interval if isinstance(interval, str) else "1d"
    group_val = group_by if isinstance(group_by, str) else "none"

    points = [
        MetricPoint(t=(today - timedelta(days=2)).isoformat(), v=92.5),
        MetricPoint(t=(today - timedelta(days=1)).isoformat(), v=95.1),
        MetricPoint(t=today.isoformat(), v=94.0),
    ]

    series = [GroupedSeries(key="all" if group_val == "none" else "AWS", points=points)]
    return ApiResponse(data=CostTimeseries(interval=int_val, series=series))


@router.get("/costs/breakdown", response_model=ApiResponse[list[CostBreakdownItem]])
async def get_costs_breakdown(
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    group_by: str = Query("service", alias="groupBy"),
    limit: int = Query(10),
) -> ApiResponse[list[CostBreakdownItem]]:
    """Get cost breakdown by service/provider/resource."""
    limit_val = limit if isinstance(limit, int) else 10

    items = [
        CostBreakdownItem(key="compute", label="Compute", amount_usd=1120.50, percent=59.6),
        CostBreakdownItem(key="database", label="Database", amount_usd=540.00, percent=28.7),
        CostBreakdownItem(key="storage", label="Storage", amount_usd=218.92, percent=11.7),
    ]
    return ApiResponse(data=items[:limit_val])


@router.get("/costs/forecast", response_model=ApiResponse[CostForecast])
async def get_costs_forecast(
    horizon_days: int = Query(30, alias="horizonDays"),
) -> ApiResponse[CostForecast]:
    """Get cost forecast with upper/lower bounds."""
    today = date.today()
    points = [
        CostForecastPoint(date=(today + timedelta(days=i)).isoformat(), amount_usd=95.0 + i * 0.5, lower=90.0, upper=100.0)
        for i in range(1, 6)
    ]
    return ApiResponse(data=CostForecast(points=points, end_of_month_usd=2968.10))
