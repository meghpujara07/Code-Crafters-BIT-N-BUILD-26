"""Unit tests for mock_generator.py."""

from datetime import datetime, timezone
from app.adapters.mock_generator import generate_metric_value


def test_determinism():
    ts = datetime(2026, 9, 19, 10, 30, tzinfo=timezone.utc)

    val1 = generate_metric_value("checkout-api", "cpu_utilization", ts, quantity=4)
    val2 = generate_metric_value("checkout-api", "cpu_utilization", ts, quantity=4)

    # Must be 100% deterministic given the same parameters
    assert val1 == val2


def test_quantity_scaling():
    ts = datetime(2026, 9, 19, 10, 30, tzinfo=timezone.utc)

    # CPU at quantity 4 (baseline) vs quantity 6 (scaled out)
    cpu_qty4 = generate_metric_value("checkout-api", "cpu_utilization", ts, quantity=4)
    cpu_qty6 = generate_metric_value("checkout-api", "cpu_utilization", ts, quantity=6)

    # Scaling out from 4 to 6 instances must lower CPU utilization
    assert cpu_qty6 < cpu_qty4
    # Ratio should be approximately 4/6 = 0.666...
    assert round(cpu_qty6 / cpu_qty4, 2) == round(4.0 / 6.0, 2)


def test_spike_multiplier():
    ts = datetime(2026, 9, 19, 10, 30, tzinfo=timezone.utc)

    normal_req = generate_metric_value("checkout-api", "request_rate", ts, is_spike=False)
    spike_req = generate_metric_value("checkout-api", "request_rate", ts, is_spike=True)

    # Spike should increase request_rate by ~1.6x
    assert spike_req > normal_req
    assert round(spike_req / normal_req, 1) == 1.6
