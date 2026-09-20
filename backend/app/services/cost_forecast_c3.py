"""C3 additive cost forecast helper.

This module deliberately does not alter the existing CostService methods. It can
be called by a later API integration once the P2/P3 shared ports are present.
"""

from dataclasses import dataclass
from datetime import date, timedelta
from statistics import mean, stdev
from typing import Sequence


@dataclass(frozen=True)
class ForecastPoint:
    date: str
    amount_usd: float
    lower: float
    upper: float


def forecast_costs(daily_amounts: Sequence[float], horizon_days: int, start: date | None = None) -> list[ForecastPoint]:
    """Forecast from month-to-date daily average with a 7-day trend adjustment and stdev band."""
    if horizon_days <= 0 or not daily_amounts:
        return []
    values = [float(v) for v in daily_amounts]
    avg = mean(values)
    recent = values[-7:]
    baseline = mean(recent)
    trend_per_day = 0.0
    if len(recent) >= 2:
        trend_per_day = (recent[-1] - recent[0]) / (len(recent) - 1)
    spread = stdev(values) if len(values) >= 2 else 0.0
    anchor = start or date.today()
    points = []
    for i in range(1, horizon_days + 1):
        estimate = max(0.0, avg + trend_per_day * i + (baseline - avg))
        points.append(ForecastPoint((anchor + timedelta(days=i)).isoformat(), round(estimate, 2), round(max(0.0, estimate - spread), 2), round(estimate + spread, 2)))
    return points
