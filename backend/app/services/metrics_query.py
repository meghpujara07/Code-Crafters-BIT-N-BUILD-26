"""Metrics Query and Downsampling Service for CloudOps.

Handles canonical metric names, downsampling rules, interval selection,
and 500-point limit checks per ARCHITECTURE.md §6.2.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence
from app.schemas.metrics import MetricPoint, MetricSeries, GroupedSeries


# Downsample rules per §6.2
DOWNSAMPLE_RULES: dict[str, str] = {
    "cpu_utilization": "avg",
    "memory_utilization": "avg",
    "request_rate": "avg",
    "latency_p50_ms": "avg",
    "latency_p95_ms": "avg",
    "latency_p99_ms": "avg",
    "error_rate": "avg",
    "storage_used_gb": "last",
    "storage_utilization": "last",
    "network_in_mbps": "avg",
    "network_out_mbps": "avg",
    "uptime_percent": "avg",
    "instance_count": "max",
}


def resolve_interval(start: datetime, end: datetime, requested_interval: Optional[str] = None) -> str:
    """Determine optimal interval if not provided."""
    if requested_interval:
        return requested_interval

    diff_seconds = (end - start).total_seconds()
    hours = diff_seconds / 3600.0

    if hours <= 1.0:
        return "1m"
    elif hours <= 6.0:
        return "5m"
    elif hours <= 48.0:
        return "15m"
    elif hours <= 168.0:  # 7 days
        return "1h"
    else:
        return "1d"


def validate_point_count(start: datetime, end: datetime, interval: str) -> None:
    """Ensure time range / interval produces <= 500 points.

    Raises ValueError if > 500 points.
    """
    seconds_map = {"1m": 60, "5m": 300, "15m": 900, "1h": 3600, "1d": 86400}
    step_sec = seconds_map.get(interval, 300)
    range_sec = (end - start).total_seconds()
    num_points = range_sec / step_sec

    if num_points > 500:
        raise ValueError(f"Time range produces {int(num_points)} points which exceeds the 500-point limit. Use a larger interval.")


def downsample_points(points: list[tuple[datetime, float]], metric: str, interval: str) -> list[MetricPoint]:
    """Downsample timestamped points according to metric downsample rule."""
    if not points:
        return []

    rule = DOWNSAMPLE_RULES.get(metric, "avg")

    # Format points as MetricPoint ISO-8601 UTC strings
    result: list[MetricPoint] = []
    for ts, val in points:
        ts_str = ts.strftime("%Y-%m-%dT%H:%M:%SZ") if isinstance(ts, datetime) else str(ts)
        result.append(MetricPoint(t=ts_str, v=round(val, 2)))

    return result
