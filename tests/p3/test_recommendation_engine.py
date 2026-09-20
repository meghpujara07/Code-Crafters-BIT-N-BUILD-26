"""Unit tests for recommendation.py DB service."""

import pytest
from uuid import uuid4
import app.services.cost  # Ensures CostService is registered with provide("cost_engine")
from app.services.recommendation import RecommendationService


@pytest.mark.asyncio
async def test_recommendation_service_generation():
    service = RecommendationService()

    resource = {
        "id": uuid4(),
        "name": "checkout-api",
        "provider": "AWS",
        "type": "COMPUTE",
        "size": "t3.medium",
        "quantity": 4,
        "min_quantity": 2,
        "max_quantity": 10,
        "supported_actions": ["SCALE_OUT", "SCALE_IN"],
    }

    metrics = {
        "cpu_utilization": [50.0, 60.0, 84.0],
        "request_rate": [1100.0, 1400.0, 1760.0],
    }

    recs = await service.generate_recommendations_for_resource(None, resource, metrics)

    assert len(recs) == 1
    rec = recs[0]
    assert rec["type"] == "SCALE_UP"
    assert rec["proposedAction"]["type"] == "SCALE_OUT"
    assert rec["proposedAction"]["params"]["targetInstances"] == 6
    assert rec["costImpact"]["deltaMonthlyUsd"] == 60.74
