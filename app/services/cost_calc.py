"""Pure Cost Calculation Engine for CloudOps.

Calculates current monthly cost, projected monthly cost, and cost delta for proposed actions
using pure math and the price catalog.
No DB session or framework dependencies.
Derived from ARCHITECTURE.md §10.5.
"""

from dataclasses import dataclass
from typing import Optional, Any
from app.adapters.price_catalog import (
    get_hourly_price,
    get_monthly_price,
    get_storage_price_per_gb_month,
)


@dataclass
class MoneyImpactCalc:
    current_monthly_cost_usd: float
    projected_monthly_cost_usd: float
    delta_monthly_usd: float
    delta_percent: float
    budget_info: Optional[dict] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "currentMonthlyCostUsd": self.current_monthly_cost_usd,
            "projectedMonthlyCostUsd": self.projected_monthly_cost_usd,
            "deltaMonthlyUsd": self.delta_monthly_usd,
            "deltaPercent": self.delta_percent,
            "budget": self.budget_info,
        }


def calculate_cost_impact(
    provider: str,
    resource_type: str,
    current_size: str,
    current_quantity: int,
    action_type: str,
    target_quantity: Optional[int] = None,
    target_size: Optional[str] = None,
    current_storage_gb: Optional[float] = None,
    target_storage_gb: Optional[float] = None,
    base_monthly_cost_override: Optional[float] = None,
) -> MoneyImpactCalc:
    """Calculate the financial impact of a proposed action.

    Args:
        provider: 'AWS', 'AZURE', 'GCP'
        resource_type: 'COMPUTE', 'DATABASE', 'STORAGE', 'LOAD_BALANCER', 'CONTAINER'
        current_size: Current instance/resource size (e.g. 't3.medium')
        current_quantity: Current running instance count
        action_type: 'SCALE_OUT', 'SCALE_IN', 'RESIZE', 'EXPAND_STORAGE', 'START', 'STOP'
        target_quantity: Desired instance count for scale actions
        target_size: Desired resource size for resize actions
        current_storage_gb: Current storage allocated in GB
        target_storage_gb: Desired storage allocated in GB
        base_monthly_cost_override: Optional explicit current monthly cost

    Returns:
        MoneyImpactCalc dataclass
    """
    prov = provider.upper()
    rtype = resource_type.upper()
    atype = action_type.upper()

    # Calculate baseline monthly compute/instance cost
    if base_monthly_cost_override is not None:
        current_compute_monthly = base_monthly_cost_override
    else:
        current_compute_monthly = get_monthly_price(prov, rtype, current_size, current_quantity)

    # Storage monthly cost if applicable
    storage_rate = get_storage_price_per_gb_month(prov, rtype, current_size)
    current_storage_monthly = (current_storage_gb or 0.0) * storage_rate

    current_total = current_compute_monthly + current_storage_monthly

    projected_total = current_total

    if atype in ("SCALE_OUT", "SCALE_IN"):
        target_qty = target_quantity if target_quantity is not None else current_quantity
        projected_compute_monthly = get_monthly_price(prov, rtype, current_size, target_qty)
        projected_total = projected_compute_monthly + current_storage_monthly

    elif atype == "RESIZE":
        new_size = target_size or current_size
        projected_compute_monthly = get_monthly_price(prov, rtype, new_size, current_quantity)
        projected_total = projected_compute_monthly + current_storage_monthly

    elif atype == "EXPAND_STORAGE":
        new_storage_gb = target_storage_gb if target_storage_gb is not None else (current_storage_gb or 0.0)
        projected_storage_monthly = new_storage_gb * storage_rate
        projected_total = current_compute_monthly + projected_storage_monthly

    elif atype == "STOP":
        # Compute cost becomes 0 when stopped; storage (if any) remains
        projected_total = current_storage_monthly

    elif atype == "START":
        projected_total = current_compute_monthly + current_storage_monthly

    delta_monthly = projected_total - current_total

    if current_total > 0:
        delta_percent = (delta_monthly / current_total) * 100.0
    else:
        delta_percent = 0.0

    return MoneyImpactCalc(
        current_monthly_cost_usd=round(current_total, 2),
        projected_monthly_cost_usd=round(projected_total, 2),
        delta_monthly_usd=round(delta_monthly, 2),
        delta_percent=round(delta_percent, 2),
        budget_info=None,
    )
