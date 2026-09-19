"""Analytics Service for CloudOps.

Handles anomaly detection, trend calculation, and health status evaluation.
Wraps analytics_calc.py functions.
Derived from ARCHITECTURE.md §10.3.
"""

from typing import Any, Optional, Sequence
from datetime import datetime, timezone
from app.services.analytics_calc import (
    detect_anomaly,
    determine_health_status,
    compute_trend,
    AnomalyCalcResult,
    TrendCalcResult,
)


class AnalyticsService:
    """Service wrapping pure analytics calculations."""

    def evaluate_anomaly(
        self, metric: str, recent_points: Sequence[float], baseline_points: Sequence[float]
    ) -> AnomalyCalcResult:
        return detect_anomaly(metric, recent_points, baseline_points)

    def evaluate_health(
        self,
        error_rate: Optional[float] = None,
        uptime_percent: Optional[float] = None,
        latency_p95_ms: Optional[float] = None,
        baseline_latency_p95_ms: Optional[float] = None,
        cpu_utilization: Optional[float] = None,
        is_missing: bool = False,
    ) -> str:
        return determine_health_status(
            error_rate=error_rate,
            uptime_percent=uptime_percent,
            latency_p95_ms=latency_p95_ms,
            baseline_latency_p95_ms=baseline_latency_p95_ms,
            cpu_utilization=cpu_utilization,
            is_missing_data=is_missing,
        )

    def evaluate_trend(self, metric: str, values: Sequence[float], timestamps_hours: Sequence[float]) -> TrendCalcResult:
        return compute_trend(metric, values, timestamps_hours)
