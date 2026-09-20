"""Anomaly schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.3.
"""

from typing import Optional
from app.schemas.base import CamelModel


class Anomaly(CamelModel):
    id: str
    kind: str  # 'TRAFFIC' | 'COST' | 'LATENCY' | 'ERROR_RATE' | 'HEALTH'
    severity: str  # 'INFO' | 'WARNING' | 'CRITICAL'
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None
    metric: str
    expected_value: float
    observed_value: float
    status: str  # 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
    detected_at: str
