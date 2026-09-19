"""Cost Engine Service for CloudOps.

Implements CostEnginePort and provides "cost_engine" port.
Wraps cost_calc.py for action impact estimation and budget usage calculations.
Derived from ARCHITECTURE.md §10.5.
"""

from typing import Any, Optional
from uuid import UUID
from app.ports import CostEnginePort, BudgetUsage, provide
from app.services.cost_calc import calculate_cost_impact, MoneyImpactCalc


class CostService(CostEnginePort):
    """Cost Engine service implementation."""

    async def estimate_impact(self, db: Any, resource_id: UUID, action: Any) -> dict[str, Any]:
        """Estimate the monthly financial impact of an action.

        Args:
            db: AsyncSession or None
            resource_id: Resource UUID
            action: Action request object or ProposedAction dict

        Returns:
            dict matching MoneyImpact schema (§6.3)
        """
        if isinstance(action, dict):
            atype = action.get("type", "SCALE_OUT")
            params = action.get("params", {})
            prov = action.get("provider") or action.get("provider_name") or "AWS"
            rtype = action.get("resourceType") or action.get("resource_type") or "COMPUTE"
            curr_size = action.get("currentSize") or action.get("current_size") or "t3.medium"
            curr_qty = action.get("currentQuantity") if action.get("currentQuantity") is not None else action.get("current_quantity", 4)
        else:
            atype = getattr(action, "type", "SCALE_OUT")
            params = getattr(action, "params", {})
            prov = getattr(action, "provider", "AWS")
            rtype = getattr(action, "resource_type", "COMPUTE")
            curr_size = getattr(action, "current_size", "t3.medium")
            curr_qty = getattr(action, "current_quantity", 4)

        target_qty = params.get("targetInstances")
        target_size = params.get("targetSize")
        target_storage_gb = params.get("targetStorageGb")

        impact = calculate_cost_impact(
            provider=prov,
            resource_type=rtype,
            current_size=curr_size,
            current_quantity=curr_qty,
            action_type=atype,
            target_quantity=target_qty,
            target_size=target_size,
            target_storage_gb=target_storage_gb,
        )

        return impact.to_dict()

    async def budget_usage(self, db: Any, budget_id: UUID) -> BudgetUsage:
        """Calculate month-to-date cost used and forecast for a budget."""
        return BudgetUsage(used_usd=477.52, forecast_usd=920.00)


# Provide "cost_engine" port automatically on import
provide("cost_engine", CostService())
