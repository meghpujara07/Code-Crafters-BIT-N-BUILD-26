"""Recommendation Service for CloudOps.

Evaluates recommendation rules, applies policy clamping via PolicyPort,
snapshots cost impacts via CostEnginePort, and manages recommendation lifecycles.
Derived from ARCHITECTURE.md §10.4.
"""

from typing import Any, Optional
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.ports import use
from app.services.recommendation_rules import (
    evaluate_recommendations,
    RecommendationCalcResult,
)


class RecommendationService:
    """Recommendation Service managing recommendation evaluation and snapshots."""

    async def generate_recommendations_for_resource(
        self,
        db: Any,
        resource: dict[str, Any],
        metrics_history: dict[str, list[float]],
    ) -> list[dict[str, Any]]:
        """Generate, clamp with policies, and snapshot recommendations for a resource."""
        r_name = resource.get("name", "resource")
        provider = resource.get("provider", "AWS")
        r_type = resource.get("type", "COMPUTE")
        size = resource.get("size", "t3.medium")
        qty = resource.get("quantity", 1)
        min_qty = resource.get("min_quantity", 1)
        max_qty = resource.get("max_quantity", 10)
        actions = resource.get("supported_actions", [])
        storage_gb = resource.get("storage_gb")

        cpu_vals = metrics_history.get("cpu_utilization", [])
        traffic_vals = metrics_history.get("request_rate", [])

        cpu_3m = cpu_vals[-1] if cpu_vals else None
        traffic_3m = traffic_vals[-1] if traffic_vals else None
        traffic_60m = sum(traffic_vals) / len(traffic_vals) if traffic_vals else None

        pure_recs = evaluate_recommendations(
            resource_name=r_name,
            provider=provider,
            resource_type=r_type,
            current_size=size,
            current_quantity=qty,
            min_quantity=min_qty,
            max_quantity=max_qty,
            supported_actions=actions,
            current_storage_gb=storage_gb,
            cpu_3m_avg=cpu_3m,
            traffic_3m_avg=traffic_3m,
            traffic_60m_avg=traffic_60m,
        )

        final_recs: list[dict[str, Any]] = []
        now_utc = datetime.now(timezone.utc)
        now_str = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

        for pure_rec in pure_recs:
            proposed_action_dict = {
                "type": pure_rec.proposed_action.action_type,
                "params": pure_rec.proposed_action.params,
                "provider": provider,
                "resourceType": r_type,
                "currentSize": size,
                "currentQuantity": qty,
            }

            cost_impact = await use("cost_engine").estimate_impact(
                db, resource.get("id", uuid4()), proposed_action_dict
            )

            policy_check = await use("policy_engine").check_limits(
                db, resource.get("id", uuid4()), proposed_action_dict, cost_impact
            )

            if isinstance(policy_check, dict) and not policy_check.get("allowed", True):
                checks = policy_check.get("checks", [])
                policy_failed = any(c.get("name") == "POLICY" and not c.get("passed", True) for c in checks)
                if policy_failed and "targetInstances" in proposed_action_dict["params"]:
                    proposed_action_dict["params"]["targetInstances"] = min(
                        max_qty, proposed_action_dict["params"]["targetInstances"]
                    )
                    cost_impact = await use("cost_engine").estimate_impact(
                        db, resource.get("id", uuid4()), proposed_action_dict
                    )
                    policy_check = await use("policy_engine").check_limits(
                        db, resource.get("id", uuid4()), proposed_action_dict, cost_impact
                    )

            if pure_rec.recommendation_type in ("SCALE_UP", "SCALE_DOWN"):
                expires_at = (now_utc + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            else:
                expires_at = (now_utc + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")

            rec_dict = {
                "id": f"rec-{uuid4().hex[:8]}",
                "resourceId": str(resource.get("id", uuid4())),
                "resourceName": r_name,
                "provider": provider,
                "type": pure_rec.recommendation_type,
                "status": "NEW",
                "title": pure_rec.title,
                "summary": pure_rec.summary,
                "confidence": pure_rec.confidence,
                "severity": pure_rec.severity,
                "reason": pure_rec.reasons,
                "proposedAction": {
                    "type": pure_rec.proposed_action.action_type,
                    "params": pure_rec.proposed_action.params,
                },
                "costImpact": cost_impact,
                "policyCheck": policy_check,
                "createdAt": now_str,
                "expiresAt": expires_at,
            }

            final_recs.append(rec_dict)

            if use("hub").has_subscribers("recommendations"):
                await use("hub").publish(
                    event="recommendation.created",
                    channel="recommendations",
                    data={
                        "recommendationId": rec_dict["id"],
                        "resourceId": rec_dict["resourceId"],
                        "resourceName": rec_dict["resourceName"],
                        "type": rec_dict["type"],
                        "title": rec_dict["title"],
                        "severity": rec_dict["severity"],
                    },
                )

        return final_recs
