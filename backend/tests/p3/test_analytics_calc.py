"""Unit tests for analytics_calc.py."""

from app.services.analytics_calc import (
    compute_z_score,
    detect_anomaly,
    determine_health_status,
    compute_trend,
)


def test_z_score_calculation():
    # Mean = 100, Std = 10 -> Value 130 has z = +3.0
    z = compute_z_score(130.0, 100.0, 10.0)
    assert z == 3.0


def test_traffic_anomaly_detection():
    baseline = [1000.0] * 20
    recent_spike = [1000.0, 1200.0, 1600.0]  # Spike to 1600 (+60%)

    res = detect_anomaly("request_rate", recent_spike, baseline)
    assert res.is_anomaly is True
    assert res.kind == "TRAFFIC"
    assert res.observed_value == 1600.0


def test_health_status_rules():
    # Healthy defaults
    assert determine_health_status(error_rate=0.1, uptime_percent=100.0, cpu_utilization=40.0) == "HEALTHY"

    # UNHEALTHY if error_rate > 5%
    assert determine_health_status(error_rate=6.0) == "UNHEALTHY"

    # UNHEALTHY if uptime < 99%
    assert determine_health_status(uptime_percent=98.5) == "UNHEALTHY"

    # DEGRADED if latency_p95 >= 2x baseline
    assert (
        determine_health_status(latency_p95_ms=320.0, baseline_latency_p95_ms=140.0, error_rate=0.2)
        == "DEGRADED"
    )

    # DEGRADED if CPU > 90%
    assert determine_health_status(cpu_utilization=94.0) == "DEGRADED"

    # UNKNOWN if missing data
    assert determine_health_status(is_missing_data=True) == "UNKNOWN"


def test_trend_calculation():
    timestamps = [0.0, 1.0, 2.0, 3.0, 4.0]
    values = [100.0, 110.0, 120.0, 130.0, 140.0]

    res = compute_trend("request_rate", values, timestamps)
    assert res.direction == "UP"
    assert res.slope > 0
    assert res.change_percent == 40.0
