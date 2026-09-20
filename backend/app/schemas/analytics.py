"""Analytics schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.4.
"""

from typing import Literal
from app.schemas.base import CamelModel


class Trend(CamelModel):
    metric: str
    slope: float
    direction: Literal["UP", "DOWN", "FLAT"]
    change_percent: float
    forecast_next_24h: float
