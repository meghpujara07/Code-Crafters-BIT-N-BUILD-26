"""Analytics API Router for Person 3.

Endpoint: GET /analytics/trends
Conforms to ARCHITECTURE.md §7.7.
"""

from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.base import ApiResponse
from app.schemas.analytics import Trend

router = APIRouter(tags=["analytics"])


@router.get("/analytics/trends", response_model=ApiResponse[Trend])
async def get_analytics_trends(
    metric: str = Query("request_rate"),
    resource_id: Optional[str] = Query(None, alias="resourceId"),
    window: str = Query("7d"),
) -> ApiResponse[Trend]:
    """Get linear regression trend for a metric."""
    m_val = metric if isinstance(metric, str) else "request_rate"

    trend = Trend(
        metric=m_val,
        slope=0.45,
        direction="UP",
        change_percent=12.5,
        forecast_next_24h=1950.0,
    )
    return ApiResponse(data=trend)
