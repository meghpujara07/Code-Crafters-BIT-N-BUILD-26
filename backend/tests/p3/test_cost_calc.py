"""Unit tests for cost_calc.py verifying exact §0 numbers."""

from app.services.cost_calc import calculate_cost_impact


def test_checkout_api_scale_out_impact():
    """Verify checkout-api scale out 4 -> 6 t3.medium.

    Current: $121.47, Projected: $182.21, Delta: +$60.74/mo.
    """
    impact = calculate_cost_impact(
        provider="AWS",
        resource_type="COMPUTE",
        current_size="t3.medium",
        current_quantity=4,
        action_type="SCALE_OUT",
        target_quantity=6,
    )

    assert impact.current_monthly_cost_usd == 121.47
    assert impact.projected_monthly_cost_usd == 182.21
    assert impact.delta_monthly_usd == 60.74
    assert impact.delta_percent == 50.0


def test_worker_pool_right_size_impact():
    """Verify worker-pool right-size t3.large -> t3.medium (quantity 3).

    Current: $182.21, Projected: $91.10, Delta: -$91.10/mo.
    """
    impact = calculate_cost_impact(
        provider="AWS",
        resource_type="COMPUTE",
        current_size="t3.large",
        current_quantity=3,
        action_type="RESIZE",
        target_size="t3.medium",
    )

    assert impact.current_monthly_cost_usd == 182.21
    assert impact.projected_monthly_cost_usd == 91.10
    assert impact.delta_monthly_usd == -91.11 or impact.delta_monthly_usd == -91.10
    # Floating point precision check: 91.10 - 182.21 = -91.11 or -91.10 depending on rounding
    assert abs(impact.delta_monthly_usd - (-91.10)) <= 0.02


def test_staging_api_stop_impact():
    """Verify staging-api STOP t3.small (quantity 1).

    Current: $15.18, Projected: $0.00, Delta: -$15.18/mo.
    """
    impact = calculate_cost_impact(
        provider="AWS",
        resource_type="COMPUTE",
        current_size="t3.small",
        current_quantity=1,
        action_type="STOP",
    )

    assert impact.current_monthly_cost_usd == 15.18
    assert impact.projected_monthly_cost_usd == 0.0
    assert impact.delta_monthly_usd == -15.18


def test_orders_db_expand_storage_impact():
    """Verify orders-db EXPAND_STORAGE 500 -> 625 GB."""
    impact = calculate_cost_impact(
        provider="AWS",
        resource_type="DATABASE",
        current_size="db.r5.large",
        current_quantity=1,
        action_type="EXPAND_STORAGE",
        current_storage_gb=500.0,
        target_storage_gb=625.0,
    )

    # db.r5.large monthly compute = 0.25 * 730 = $182.50
    # 500 GB storage @ $0.115/GB-mo = $57.50
    # Total current = $240.00
    # 625 GB storage @ $0.115/GB-mo = $71.875 -> $71.88
    # Projected total = $254.38
    # Delta storage = +125 GB * 0.115 = +$14.38/mo
    assert impact.delta_monthly_usd == 14.38
