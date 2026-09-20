"""Billing Statements API Router for Person 3.

Endpoint: GET /billing/statements
Conforms to ARCHITECTURE.md §7.6.
"""

from typing import Optional
from fastapi import APIRouter, Query
from app.schemas.base import ApiResponse
from app.schemas.billing import BillingStatement, BillingLine

router = APIRouter(tags=["billing"])


@router.get("/billing/statements", response_model=ApiResponse[list[BillingStatement]])
async def get_billing_statements(
    account_id: Optional[str] = Query(None, alias="accountId"),
    year: Optional[int] = Query(None),
) -> ApiResponse[list[BillingStatement]]:
    """Get billing statements."""
    statements = [
        BillingStatement(
            id="stmt-2026-08-aws",
            account_id="acc-aws-prod-1",
            provider="AWS",
            period="2026-08",
            total_usd=750.40,
            status="PAID",
            lines=[
                BillingLine(service="checkout-api", amount_usd=121.47),
                BillingLine(service="worker-pool", amount_usd=182.21),
                BillingLine(service="orders-db", amount_usd=240.00),
            ],
        ),
        BillingStatement(
            id="stmt-2026-08-azure",
            account_id="acc-azure-prod-1",
            provider="AZURE",
            period="2026-08",
            total_usd=1420.00,
            status="PAID",
            lines=[
                BillingLine(service="billing-api", amount_usd=210.24),
                BillingLine(service="aks-workers", amount_usd=700.80),
            ],
        ),
    ]
    return ApiResponse(data=statements)
