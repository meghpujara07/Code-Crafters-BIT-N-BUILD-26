"""Billing schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.4.
"""

from typing import Literal
from app.schemas.base import CamelModel


class BillingLine(CamelModel):
    service: str
    amount_usd: float


class BillingStatement(CamelModel):
    id: str
    account_id: str
    provider: str  # 'AWS' | 'AZURE' | 'GCP'
    period: str  # e.g. "2026-08"
    total_usd: float
    status: Literal["OPEN", "FINAL", "PAID"]
    lines: list[BillingLine] = []
