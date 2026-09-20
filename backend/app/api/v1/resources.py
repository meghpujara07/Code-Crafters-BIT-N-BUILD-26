"""Resources API Router for Person 3.

Endpoints: GET /resources, GET/PATCH /resources/{id}, metrics, health, cost
Conforms to ARCHITECTURE.md §7.4.
"""

from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query, HTTPException, Path
from app.schemas.base import ApiResponse, PagedResponse, PageMeta
from app.schemas.resources import (
    Resource,
    ResourcePatch,
    ResourceLatest,
    ResourceHealthDetail,
    ResourceHealthCheck,
    ResourceCost,
    ResourceCostDailyItem,
)
from app.schemas.metrics import ResourceMetrics, MetricSeries, MetricPoint
from app.adapters.mock_adapter import SEEDED_RESOURCES
from app.ports import use

router = APIRouter(tags=["resources"])


def _to_resource_schema(r: dict) -> Resource:
    return Resource(
        id=r["external_id"],
        account_id="acc-aws-prod-1",
        provider=r["provider"],
        external_id=r["external_id"],
        name=r["name"],
        type=r["type"],
        region=r["region"],
        status=r["status"],
        health="UNHEALTHY" if r["name"] == "reports-db" else ("DEGRADED" if r["name"] == "billing-api" else "HEALTHY"),
        size=r["size"],
        quantity=r["quantity"],
        min_quantity=r["min_quantity"],
        max_quantity=r["max_quantity"],
        supported_actions=r["supported_actions"],
        storage_gb=r["storage_gb"],
        monthly_cost_usd=121.47 if r["name"] == "checkout-api" else 150.0,
        tags=r["tags"],
        latest=ResourceLatest(
            cpu_utilization=52.0 if r["name"] == "checkout-api" else 35.0,
            memory_utilization=45.0,
            request_rate=1100.0 if r["name"] == "checkout-api" else 150.0,
            latency_p95_ms=180.0,
            error_rate=6.0 if r["name"] == "reports-db" else 0.1,
            storage_utilization=84.0 if r["name"] == "orders-db" else None,
        ),
        last_seen_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


@router.get("/resources", response_model=PagedResponse[Resource])
async def list_resources(
    provider: Optional[str] = Query(None),
    account_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    health: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: Optional[str] = Query("name,asc"),
) -> PagedResponse[Resource]:
    """List resources with filtering and pagination."""
    items = [_to_resource_schema(r) for r in SEEDED_RESOURCES]

    prov_val = provider if isinstance(provider, str) else None
    type_val = type if isinstance(type, str) else None
    status_val = status if isinstance(status, str) else None
    health_val = health if isinstance(health, str) else None
    search_val = search if isinstance(search, str) else None
    page_val = page if isinstance(page, int) else 1
    page_size_val = page_size if isinstance(page_size, int) else 20

    if prov_val:
        items = [i for i in items if i.provider.upper() == prov_val.upper()]
    if type_val:
        items = [i for i in items if i.type.upper() == type_val.upper()]
    if status_val:
        items = [i for i in items if i.status.upper() == status_val.upper()]
    if health_val:
        items = [i for i in items if i.health.upper() == health_val.upper()]
    if search_val:
        items = [i for i in items if search_val.lower() in i.name.lower()]

    total = len(items)
    start_idx = (page_val - 1) * page_size_val
    end_idx = start_idx + page_size_val
    paged_items = items[start_idx:end_idx]

    meta = PageMeta(
        page=page_val,
        page_size=page_size_val,
        total=total,
        total_pages=(total + page_size_val - 1) // page_size_val if total > 0 else 1,
    )
    return PagedResponse(data=paged_items, meta=meta)


@router.get("/resources/{id}", response_model=ApiResponse[Resource])
async def get_resource_by_id(id: str = Path(...)) -> ApiResponse[Resource]:
    """Get single resource by ID."""
    res = next((r for r in SEEDED_RESOURCES if r["external_id"] == id), None)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return ApiResponse(data=_to_resource_schema(res))


@router.patch("/resources/{id}", response_model=ApiResponse[Resource])
async def patch_resource(id: str = Path(...), patch: ResourcePatch = ...) -> ApiResponse[Resource]:
    """Patch resource metadata/bounds."""
    res = next((r for r in SEEDED_RESOURCES if r["external_id"] == id), None)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    if patch.min_quantity is not None and patch.max_quantity is not None:
        if patch.min_quantity > res["quantity"] or res["quantity"] > patch.max_quantity:
            raise HTTPException(status_code=400, detail="New bounds must satisfy minQuantity <= quantity <= maxQuantity")

    if patch.tags is not None:
        res["tags"].update(patch.tags)
    if patch.min_quantity is not None:
        res["min_quantity"] = patch.min_quantity
    if patch.max_quantity is not None:
        res["max_quantity"] = patch.max_quantity

    await use("audit").write(
        None, actor_id=None, action="PATCH", entity_type="RESOURCE", entity_id=id, before=None, after=res
    )

    return ApiResponse(data=_to_resource_schema(res))


@router.get("/resources/{id}/metrics", response_model=ApiResponse[ResourceMetrics])
async def get_resource_metrics(
    id: str = Path(...),
    metric: str = Query("cpu_utilization,request_rate"),
    from_time: Optional[str] = Query(None, alias="from"),
    to_time: Optional[str] = Query(None, alias="to"),
    interval: str = Query("5m"),
) -> ApiResponse[ResourceMetrics]:
    """Get metrics series for a single resource."""
    m_val = metric if isinstance(metric, str) else "cpu_utilization,request_rate"
    int_val = interval if isinstance(interval, str) else "5m"

    metric_names = [m.strip() for m in m_val.split(",")]
    now_utc = datetime.now(timezone.utc)
    ts_str = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    series_list: list[MetricSeries] = []
    for m in metric_names:
        pts = [
            MetricPoint(t=(now_utc - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"), v=50.0),
            MetricPoint(t=(now_utc - timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%SZ"), v=52.5),
            MetricPoint(t=ts_str, v=55.0),
        ]
        series_list.append(MetricSeries(metric=m, unit="%" if "cpu" in m else "req/s", points=pts))

    return ApiResponse(data=ResourceMetrics(resource_id=id, interval=int_val, series=series_list))


@router.get("/resources/{id}/health", response_model=ApiResponse[ResourceHealthDetail])
async def get_resource_health(id: str = Path(...)) -> ApiResponse[ResourceHealthDetail]:
    """Get health details and checks for a resource."""
    res = next((r for r in SEEDED_RESOURCES if r["external_id"] == id), None)
    is_unhealthy = res and res["name"] == "reports-db"
    is_degraded = res and res["name"] == "billing-api"

    health = "UNHEALTHY" if is_unhealthy else ("DEGRADED" if is_degraded else "HEALTHY")
    checks = [
        ResourceHealthCheck(name="CpuCheck", status="PASS", message="CPU is normal"),
        ResourceHealthCheck(
            name="ErrorRateCheck",
            status="FAIL" if is_unhealthy else "PASS",
            message="Error rate > 5%" if is_unhealthy else "Error rate normal",
        ),
    ]

    return ApiResponse(
        data=ResourceHealthDetail(
            health=health,
            uptime_percent=98.0 if is_unhealthy else 99.95,
            last_incident_at="2026-09-18T12:00:00Z" if is_unhealthy else None,
            checks=checks,
        )
    )


@router.get("/resources/{id}/cost", response_model=ApiResponse[ResourceCost])
async def get_resource_cost(id: str = Path(...)) -> ApiResponse[ResourceCost]:
    """Get cost history and forecast for a single resource."""
    daily = [
        ResourceCostDailyItem(date="2026-09-18", amount_usd=4.05),
        ResourceCostDailyItem(date="2026-09-19", amount_usd=4.05),
    ]
    return ApiResponse(data=ResourceCost(month_to_date_usd=77.0, forecast_usd=121.47, daily_costs=daily))
