"""Deterministic Metric Generator for CloudOps Mock Cloud.

Generates realistic metric values using pure, deterministic mathematical functions.
Formula per ARCHITECTURE.md §11:
    value = base * dailyCurve(hour) * weeklyFactor(dow) * (1 + noise(seed, minuteBucket)) * spikeMultiplier(t)
    and CPU scales with (baselineQuantity / quantity).
"""

import math
import hashlib
from datetime import datetime, timezone
from typing import Optional, Any


# Resource profiles containing base metric levels
RESOURCE_PROFILES: dict[str, dict[str, float]] = {
    "checkout-api": {
        "cpu_utilization": 52.0,
        "memory_utilization": 45.0,
        "request_rate": 1100.0,
        "latency_p50_ms": 110.0,
        "latency_p95_ms": 180.0,
        "latency_p99_ms": 250.0,
        "error_rate": 0.1,
        "network_in_mbps": 45.0,
        "network_out_mbps": 120.0,
        "uptime_percent": 100.0,
        "baseline_quantity": 4,
    },
    "worker-pool": {
        "cpu_utilization": 30.0,
        "memory_utilization": 35.0,
        "request_rate": 450.0,
        "latency_p50_ms": 150.0,
        "latency_p95_ms": 280.0,
        "latency_p99_ms": 400.0,
        "error_rate": 0.05,
        "network_in_mbps": 30.0,
        "network_out_mbps": 60.0,
        "uptime_percent": 100.0,
        "baseline_quantity": 3,
    },
    "staging-api": {
        "cpu_utilization": 2.5,
        "memory_utilization": 15.0,
        "request_rate": 10.0,
        "latency_p50_ms": 45.0,
        "latency_p95_ms": 80.0,
        "latency_p99_ms": 120.0,
        "error_rate": 0.0,
        "network_in_mbps": 1.0,
        "network_out_mbps": 2.0,
        "uptime_percent": 100.0,
        "baseline_quantity": 1,
    },
    "orders-db": {
        "cpu_utilization": 42.0,
        "memory_utilization": 60.0,
        "storage_used_gb": 420.0,
        "storage_utilization": 84.0,  # 420 / 500 GB = 84%
        "latency_p95_ms": 12.0,
        "error_rate": 0.0,
        "uptime_percent": 100.0,
        "baseline_quantity": 1,
    },
    "search-svc": {
        "cpu_utilization": 18.0,
        "memory_utilization": 30.0,
        "request_rate": 200.0,
        "latency_p50_ms": 60.0,
        "latency_p95_ms": 95.0,
        "error_rate": 0.0,
        "baseline_quantity": 2,
    },
    "billing-api": {
        "cpu_utilization": 48.0,
        "memory_utilization": 50.0,
        "request_rate": 350.0,
        "latency_p95_ms": 320.0,  # Elevated (2.2x baseline) -> DEGRADED
        "error_rate": 0.2,
        "baseline_quantity": 3,
    },
    "reports-db": {
        "cpu_utilization": 65.0,
        "memory_utilization": 70.0,
        "storage_used_gb": 210.0,
        "storage_utilization": 70.0,
        "latency_p95_ms": 45.0,
        "error_rate": 6.0,  # 6% -> UNHEALTHY (>5%)
        "baseline_quantity": 1,
    },
    "default": {
        "cpu_utilization": 35.0,
        "memory_utilization": 40.0,
        "request_rate": 150.0,
        "latency_p50_ms": 50.0,
        "latency_p95_ms": 90.0,
        "latency_p99_ms": 140.0,
        "error_rate": 0.0,
        "storage_used_gb": 50.0,
        "storage_utilization": 50.0,
        "network_in_mbps": 10.0,
        "network_out_mbps": 20.0,
        "uptime_percent": 100.0,
        "baseline_quantity": 1,
    },
}


def _daily_curve(hour: int) -> float:
    """Return daily factor between ~0.75 (night) and ~1.25 (peak business hours)."""
    # Peak at hour 14 UTC, trough at hour 2 UTC
    angle = (hour - 14) * 2 * math.pi / 24.0
    return 1.0 + 0.25 * math.cos(angle)


def _weekly_factor(day_of_week: int) -> float:
    """Return weekly factor: 1.0 for Mon-Fri (0-4), 0.75 for Sat-Sun (5-6)."""
    if day_of_week >= 5:
        return 0.75
    return 1.0


def _deterministic_noise(seed: str, ts: datetime) -> float:
    """Return bounded noise in [-0.05, 0.05] deterministically calculated from seed + minute timestamp."""
    minute_str = ts.strftime("%Y-%m-%d %H:%M")
    key = f"{seed}:{minute_str}".encode("utf-8")
    hash_val = int(hashlib.md5(key).hexdigest()[:8], 16)
    # Map unsigned 32-bit int to [-0.05, 0.05]
    normalized = (hash_val / 0xFFFFFFFF) * 0.10 - 0.05
    return normalized


def generate_metric_value(
    resource_name: str,
    metric: str,
    timestamp: datetime,
    quantity: int = 1,
    is_spike: bool = False,
    override_base: Optional[float] = None,
) -> float:
    """Generate a single deterministic metric point value.

    Args:
        resource_name: Profile key or resource name (e.g. 'checkout-api')
        metric: Canonical metric name (e.g. 'cpu_utilization')
        timestamp: UTC timestamp
        quantity: Current running instance count
        is_spike: If True, applies spike multiplier (e.g. 1.6x for traffic)
        override_base: Optional base value override

    Returns:
        float: Generated metric value rounded appropriately
    """
    profile = RESOURCE_PROFILES.get(resource_name, RESOURCE_PROFILES["default"])

    if override_base is not None:
        base = override_base
    else:
        base = profile.get(metric, RESOURCE_PROFILES["default"].get(metric, 10.0))

    baseline_qty = profile.get("baseline_quantity", 1)

    hour = timestamp.hour
    dow = timestamp.weekday()

    d_curve = _daily_curve(hour)
    w_factor = _weekly_factor(dow)
    noise = _deterministic_noise(f"{resource_name}:{metric}", timestamp)

    spike_mult = 1.6 if (is_spike and metric in ("request_rate", "cpu_utilization")) else 1.0

    # CPU utilization scales inversely with quantity: CPU = base * (baseline_qty / current_qty)
    if metric == "cpu_utilization" and quantity > 0:
        base_scaled = base * (baseline_qty / quantity)
        val = base_scaled * d_curve * w_factor * (1.0 + noise) * spike_mult
        val = min(100.0, max(0.0, val))
    elif metric in ("memory_utilization", "storage_utilization", "error_rate", "uptime_percent"):
        # Percentage metrics clamped to [0, 100]
        val = base * (1.0 + noise * 0.2)
        if metric in ("memory_utilization", "storage_utilization"):
            val = val * d_curve * 0.1 + base * 0.9  # Mild variation
        val = min(100.0, max(0.0, val))
    elif metric == "request_rate":
        val = base * d_curve * w_factor * (1.0 + noise) * spike_mult
        val = max(0.0, val)
    elif metric.startswith("latency_"):
        # Latency increases slightly with spike
        lat_spike = 1.3 if (is_spike and metric in ("latency_p95_ms", "latency_p99_ms")) else 1.0
        val = base * (1.0 + noise * 0.5) * lat_spike
        val = max(0.0, val)
    else:
        val = base * d_curve * w_factor * (1.0 + noise)
        val = max(0.0, val)

    return round(val, 2)
