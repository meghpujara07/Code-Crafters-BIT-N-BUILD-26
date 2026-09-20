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
    def evaluate_budget_thresholds(
        self,
        amount_usd: float,
        used_usd: float,
        alert_thresholds: Sequence[int],
    ) -> list[int]:
        """Return budget thresholds reached by current usage."""
        if amount_usd <= 0:
            return []

        usage_percent = (float(used_usd) / float(amount_usd)) * 100.0

        return [
            threshold
            for threshold in sorted(set(alert_thresholds))
            if 0 <= threshold <= 100 and usage_percent >= threshold
        ]
    async def raise_budget_threshold_alerts(
        self,
        db: Any,
        budget_name: str,
        amount_usd: float,
        used_usd: float,
        alert_thresholds: Sequence[int],
        month: str | None = None,
    ) -> list[int]:
        """Raise alerts for budget thresholds reached this month."""
        from app.ports import use

        crossed = self.evaluate_budget_thresholds(
            amount_usd=amount_usd,
            used_usd=used_usd,
            alert_thresholds=alert_thresholds,
        )

        if not crossed:
            return []

        month_label = month or datetime.now(timezone.utc).strftime("%Y-%m")
        alerts = use("alerts")

        for threshold in crossed:
            await alerts.raise_alert(
                db,
                severity="WARNING" if threshold < 100 else "CRITICAL",
                source="BUDGET_THRESHOLD",
                title=f"{budget_name} budget threshold {threshold}% ({month_label})",
                message=(
                    f"{budget_name} has reached the {threshold}% "
                    f"monthly budget threshold."
                ),
            )

        return crossed