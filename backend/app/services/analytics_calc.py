"""Pure Analytics Calculation Engine for CloudOps.

Handles Z-score anomaly detection, health classification, and linear regression trends.
Uses pure numpy / Python logic without DB or network dependencies.
Derived from ARCHITECTURE.md §10.3.
"""

from dataclasses import dataclass
from typing import Optional, Sequence
import numpy as np


@dataclass
class AnomalyCalcResult:
    is_anomaly: bool
    kind: str  # 'TRAFFIC' | 'COST' | 'LATENCY' | 'ERROR_RATE' | 'HEALTH'
    severity: str  # 'INFO' | 'WARNING' | 'CRITICAL'
    z_score: float
    expected_value: float
    observed_value: float
    message: str


@dataclass
class TrendCalcResult:
    metric: str
    slope: float
    direction: str  # 'UP' | 'DOWN' | 'FLAT'
    change_percent: float
    forecast_next_24h: float


def compute_z_score(observed: float, baseline_mean: float, baseline_std: float) -> float:
    """Calculate Z-score for an observed value relative to a baseline."""
    if baseline_std <= 1e-6:
        return 0.0
    return (observed - baseline_mean) / baseline_std


def detect_anomaly(
    metric: str,
    recent_values: Sequence[float],
    baseline_values: Sequence[float],
    z_threshold: float = 3.0,
    traffic_spike_threshold_percent: float = 50.0,
) -> AnomalyCalcResult:
    """Detect if recent metric values constitute an anomaly.

    Flag when |z| > 3 for 3 consecutive points, or traffic > +50% vs baseline.
    """
    if not baseline_values or not recent_values:
        return AnomalyCalcResult(
            is_anomaly=False,
            kind="TRAFFIC" if "request" in metric else "METRIC",
            severity="INFO",
            z_score=0.0,
            expected_value=0.0,
            observed_value=recent_values[-1] if recent_values else 0.0,
            message="Insufficient data",
        )

    base_arr = np.array(baseline_values, dtype=float)
    mean_val = float(np.mean(base_arr))
    std_val = float(np.std(base_arr))

    latest_val = float(recent_values[-1])
    latest_z = compute_z_score(latest_val, mean_val, std_val)

    # Check traffic > +50% vs baseline rule
    is_traffic_spike = False
    if "request_rate" in metric or metric == "request_rate":
        if mean_val > 0 and ((latest_val - mean_val) / mean_val * 100.0) >= traffic_spike_threshold_percent:
            is_traffic_spike = True

    # Check |z| > z_threshold for 3 consecutive recent points
    consecutive_z_exceeded = False
    if len(recent_values) >= 3:
        z_scores = [abs(compute_z_score(v, mean_val, std_val)) for v in recent_values[-3:]]
        if all(z > z_threshold for z in z_scores):
            consecutive_z_exceeded = True
    elif abs(latest_z) > z_threshold:
        consecutive_z_exceeded = True

    is_anomaly = consecutive_z_exceeded or is_traffic_spike

    # Determine kind
    if "request" in metric or metric == "request_rate":
        kind = "TRAFFIC"
    elif "cost" in metric:
        kind = "COST"
    elif "latency" in metric:
        kind = "LATENCY"
    elif "error" in metric:
        kind = "ERROR_RATE"
    else:
        kind = "HEALTH"

    # Determine severity
    if kind == "ERROR_RATE" or abs(latest_z) > 4.0:
        severity = "CRITICAL"
    elif is_anomaly:
        severity = "WARNING"
    else:
        severity = "INFO"

    msg = f"Observed {latest_val:.2f} vs expected {mean_val:.2f} (z={latest_z:.2f})"
    if is_traffic_spike:
        msg = f"Traffic spike detected: {latest_val:.2f} req/s (+{(latest_val-mean_val)/mean_val*100:.1f}% vs baseline)"

    return AnomalyCalcResult(
        is_anomaly=is_anomaly,
        kind=kind,
        severity=severity,
        z_score=round(latest_z, 2),
        expected_value=round(mean_val, 2),
        observed_value=round(latest_val, 2),
        message=msg,
    )


def determine_health_status(
    error_rate: Optional[float] = None,
    uptime_percent: Optional[float] = None,
    latency_p95_ms: Optional[float] = None,
    baseline_latency_p95_ms: Optional[float] = None,
    cpu_utilization: Optional[float] = None,
    is_missing_data: bool = False,
) -> str:
    """Determine health status: HEALTHY | DEGRADED | UNHEALTHY | UNKNOWN per §10.3."""
    if is_missing_data:
        return "UNKNOWN"

    # UNHEALTHY if error_rate > 5% or uptime_percent < 99%
    if error_rate is not None and error_rate > 5.0:
        return "UNHEALTHY"
    if uptime_percent is not None and uptime_percent < 99.0:
        return "UNHEALTHY"

    # DEGRADED if latency_p95 > 2x baseline or cpu > 90%
    if latency_p95_ms is not None and baseline_latency_p95_ms is not None and baseline_latency_p95_ms > 0:
        if latency_p95_ms >= 2.0 * baseline_latency_p95_ms:
            return "DEGRADED"

    if cpu_utilization is not None and cpu_utilization > 90.0:
        return "DEGRADED"

    return "HEALTHY"


def compute_trend(metric: str, values: Sequence[float], timestamps_hours: Sequence[float]) -> TrendCalcResult:
    """Compute linear regression trend over a window.

    Args:
        metric: metric name
        values: sequence of metric values
        timestamps_hours: hours from start of window (e.g. 0.0, 1.0, 2.0...)

    Returns:
        TrendCalcResult
    """
    if len(values) < 2 or len(values) != len(timestamps_hours):
        return TrendCalcResult(
            metric=metric,
            slope=0.0,
            direction="FLAT",
            change_percent=0.0,
            forecast_next_24h=values[-1] if values else 0.0,
        )

    x = np.array(timestamps_hours, dtype=float)
    y = np.array(values, dtype=float)

    # Linear fit: y = slope * x + intercept
    slope, intercept = np.polyfit(x, y, 1)

    first_val = float(y[0])
    last_val = float(y[-1])

    if first_val > 0:
        change_pct = (last_val - first_val) / first_val * 100.0
    else:
        change_pct = 0.0

    if abs(slope) < 0.01:
        direction = "FLAT"
    elif slope > 0:
        direction = "UP"
    else:
        direction = "DOWN"

    next_x = x[-1] + 24.0
    forecast_val = max(0.0, slope * next_x + intercept)

    return TrendCalcResult(
        metric=metric,
        slope=round(float(slope), 4),
        direction=direction,
        change_percent=round(change_pct, 2),
        forecast_next_24h=round(forecast_val, 2),
    )
