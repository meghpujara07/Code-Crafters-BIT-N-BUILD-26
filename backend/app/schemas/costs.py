"""Cost schemas for Person 3 APIs.

Conforms to ARCHITECTURE.md §6.4.
"""

from typing import Literal
from app.schemas.base import CamelModel
from app.schemas.metrics import GroupedSeries


class CostSummary(CamelModel):
    month_to_date_usd: float
    forecast_end_of_month_usd: float
    last_month_usd: float
    change_percent: float
    budget_usd: float
    budget_used_percent: float
    currency: Literal["USD"] = "USD"


class CostTimeseries(CamelModel):
    interval: str
    series: list[GroupedSeries] = []


class CostBreakdownItem(CamelModel):
    key: str
    label: str
    amount_usd: float
    percent: float


class CostForecastPoint(CamelModel):
    date: str
    amount_usd: float
    lower: float
    upper: float


class CostForecast(CamelModel):
    points: list[CostForecastPoint] = []
    end_of_month_usd: float
