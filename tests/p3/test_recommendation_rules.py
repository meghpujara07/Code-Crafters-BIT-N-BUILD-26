"""Unit tests for recommendation_rules.py."""

from app.services.recommendation_rules import evaluate_recommendations


def test_scale_up_recommendation():
    """Verify SCALE_UP trigger on checkout-api traffic spike / high CPU."""
    recs = evaluate_recommendations(
        resource_name="checkout-api",
        provider="AWS",
        resource_type="COMPUTE",
        current_size="t3.medium",
        current_quantity=4,
        min_quantity=2,
        max_quantity=10,
        supported_actions=["SCALE_OUT", "SCALE_IN", "RESIZE", "STOP", "START"],
        cpu_3m_avg=84.0,  # > 75%
        traffic_3m_avg=1760.0,
        traffic_60m_avg=1100.0,  # 1760 / 1100 = 1.6x > 1.5x
    )

    assert len(recs) == 1
    rec = recs[0]
    assert rec.recommendation_type == "SCALE_UP"
    assert rec.proposed_action.action_type == "SCALE_OUT"
    assert rec.proposed_action.params["targetInstances"] == 6


def test_scale_down_recommendation():
    """Verify SCALE_DOWN trigger when CPU < 25% for 6h."""
    recs = evaluate_recommendations(
        resource_name="search-svc",
        provider="GCP",
        resource_type="COMPUTE",
        current_size="e2-standard-2",
        current_quantity=2,
        min_quantity=1,
        max_quantity=6,
        supported_actions=["SCALE_OUT", "SCALE_IN", "RESIZE"],
        cpu_6h_avg=18.0,
        traffic_below_baseline_6h=True,
    )

    assert len(recs) == 1
    rec = recs[0]
    assert rec.recommendation_type == "SCALE_DOWN"
    assert rec.proposed_action.action_type == "SCALE_IN"
    assert rec.proposed_action.params["targetInstances"] == 1


def test_right_size_recommendation():
    """Verify RIGHT_SIZE trigger when worker-pool CPU p95 < 40% for 7d."""
    recs = evaluate_recommendations(
        resource_name="worker-pool",
        provider="AWS",
        resource_type="COMPUTE",
        current_size="t3.large",
        current_quantity=3,
        min_quantity=1,
        max_quantity=8,
        supported_actions=["SCALE_OUT", "SCALE_IN", "RESIZE"],
        cpu_7d_p95=30.0,
        memory_7d_avg=35.0,
    )

    assert len(recs) == 1
    rec = recs[0]
    assert rec.recommendation_type == "RIGHT_SIZE"
    assert rec.proposed_action.action_type == "RESIZE"
    assert rec.proposed_action.params["targetSize"] == "t3.medium"


def test_cost_optimization_stop_idle():
    """Verify COST_OPTIMIZATION trigger when staging-api CPU < 5% for 3d."""
    recs = evaluate_recommendations(
        resource_name="staging-api",
        provider="AWS",
        resource_type="COMPUTE",
        current_size="t3.small",
        current_quantity=1,
        min_quantity=1,
        max_quantity=2,
        supported_actions=["SCALE_OUT", "SCALE_IN", "RESIZE", "STOP", "START"],
        cpu_below_5pct_3d=True,
    )

    assert len(recs) == 1
    rec = recs[0]
    assert rec.recommendation_type == "COST_OPTIMIZATION"
    assert rec.proposed_action.action_type == "STOP"


def test_resource_allocation_storage_expansion():
    """Verify RESOURCE_ALLOCATION trigger when orders-db storage > 80%."""
    recs = evaluate_recommendations(
        resource_name="orders-db",
        provider="AWS",
        resource_type="DATABASE",
        current_size="db.r5.large",
        current_quantity=1,
        min_quantity=1,
        max_quantity=1,
        supported_actions=["EXPAND_STORAGE"],
        current_storage_gb=500.0,
        storage_utilization=84.0,
    )

    assert len(recs) == 1
    rec = recs[0]
    assert rec.recommendation_type == "RESOURCE_ALLOCATION"
    assert rec.proposed_action.action_type == "EXPAND_STORAGE"
    assert rec.proposed_action.params["targetStorageGb"] == 625
