"""Anomalies API Router for Person 3.

Endpoints: GET /anomalies, POST /anomalies/{id}/acknowledge
Conforms to ARCHITECTURE.md §7.7.
"""

from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query, Path, HTTPException
from app.schemas.base import ApiResponse, PagedResponse, PageMeta
from app.schemas.anomalies import Anomaly

router = APIRouter(tags=["anomalies"])

SEED_ANOMALIES: list[dict] = [
    {
        "id": "anom-001",
        "kind": "COST",
        "severity": "WARNING",
        "resource_id": "res-az-aks-workers",
        "resource_name": "aks-workers",
        "metric": "daily_cost",
        "expected_value": 70.0,
        "observed_value": 175.0,
        "status": "OPEN",
        "detected_at": "2026-09-16T10:00:00Z",
    },
    {
        "id": "anom-002",
        "kind": "TRAFFIC",
        "severity": "WARNING",
        "resource_id": "b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30",
        "resource_name": "checkout-api",
        "metric": "request_rate",
        "expected_value": 1100.0,
        "observed_value": 1760.0,
        "status": "OPEN",
        "detected_at": "2026-09-19T10:30:00Z",
    },
]


@router.get("/anomalies", response_model=PagedResponse[Anomaly])
async def list_anomalies(
    kind: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None, alias="resourceId"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PagedResponse[Anomaly]:
    """List anomalies with filters."""
    items = [Anomaly(**a) for a in SEED_ANOMALIES]

    kind_val = kind if isinstance(kind, str) else None
    sev_val = severity if isinstance(severity, str) else None
    stat_val = status if isinstance(status, str) else None
    res_val = resource_id if isinstance(resource_id, str) else None
    page_val = page if isinstance(page, int) else 1
    page_size_val = page_size if isinstance(page_size, int) else 20

    if kind_val:
        items = [i for i in items if i.kind.upper() == kind_val.upper()]
    if sev_val:
        items = [i for i in items if i.severity.upper() == sev_val.upper()]
    if stat_val:
        items = [i for i in items if i.status.upper() == stat_val.upper()]
    if res_val:
        items = [i for i in items if i.resource_id == res_val]

    total = len(items)
    meta = PageMeta(page=page_val, page_size=page_size_val, total=total, total_pages=1)
    return PagedResponse(data=items, meta=meta)


@router.get("/anomalies/{id}", response_model=ApiResponse[Anomaly])
async def get_anomaly_by_id(id: str = Path(...)) -> ApiResponse[Anomaly]:
    """Get single anomaly by ID."""
    anom = next((a for a in SEED_ANOMALIES if a["id"] == id), None)
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return ApiResponse(data=Anomaly(**anom))


@router.post("/anomalies/{id}/acknowledge", response_model=ApiResponse[Anomaly])
async def acknowledge_anomaly(id: str = Path(...)) -> ApiResponse[Anomaly]:
    """Acknowledge an open anomaly."""
    anom = next((a for a in SEED_ANOMALIES if a["id"] == id), None)
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    anom["status"] = "ACKNOWLEDGED"
    return ApiResponse(data=Anomaly(**anom))
