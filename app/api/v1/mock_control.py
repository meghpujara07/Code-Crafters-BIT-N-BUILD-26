"""Mock Control API Router for Person 3.

Endpoint: POST /system/mock/spike
Guarded by ENABLE_DEMO_CONTROLS per ARCHITECTURE.md §11.
"""

import os
from fastapi import APIRouter, HTTPException
from app.schemas.base import ApiResponse
from app.ports import use

router = APIRouter(tags=["mock_control"])


@router.post("/system/mock/spike", response_model=ApiResponse[dict])
async def trigger_mock_spike() -> ApiResponse[dict]:
    """Trigger simulated traffic spike on checkout-api."""
    demo_controls = os.getenv("ENABLE_DEMO_CONTROLS", "true").lower() == "true"
    if not demo_controls:
        raise HTTPException(status_code=404, detail="Demo controls disabled")

    # Trigger ingestion account sync via port
    from uuid import UUID

    checkout_acc_id = UUID("00000000-0000-0000-0000-000000000001")
    await use("ingestion").sync_account(checkout_acc_id)

    return ApiResponse(
        data={
            "triggered": True,
            "targetResource": "checkout-api",
            "message": "Traffic spike simulated (+60% traffic, CPU ~84%). Ingestion cycle triggered.",
        }
    )
