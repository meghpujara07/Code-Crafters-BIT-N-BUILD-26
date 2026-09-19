"""Pure Recommendation Rules Engine for CloudOps.

Evaluates metric patterns against recommendation triggers to generate proposed actions.
No DB, policy engine, or network dependencies.
Derived from ARCHITECTURE.md §10.4.
"""

import math
from dataclasses import dataclass, field
from typing import Optional, Any
from app.adapters.price_catalog import get_next_smaller_size


@dataclass
class ProposedActionCalc:
    action_type: str  # 'SCALE_OUT' | 'SCALE_IN' | 'RESIZE' | 'EXPAND_STORAGE' | 'START' | 'STOP'
    params: dict[str, Any] = field(default_factory=dict)


@dataclass
class RecommendationCalcResult:
    recommendation_type: str  # 'SCALE_UP' | 'SCALE_DOWN' | 'RIGHT_SIZE' | 'COST_OPTIMIZATION' | 'RESOURCE_ALLOCATION'
    title: str
    summary: str
    severity: str  # 'INFO' | 'WARNING' | 'CRITICAL'
    confidence: int  # 0 - 100
    proposed_action: ProposedActionCalc
    reasons: list[dict[str, Any]] = field(default_factory=list)


def evaluate_recommendations(
    resource_name: str,
    provider: str,
    resource_type: str,
    current_size: str,
    current_quantity: int,
    min_quantity: int,
    max_quantity: int,
    supported_actions: list[str],
    current_storage_gb: Optional[float] = None,
    cpu_3m_avg: Optional[float] = None,
    cpu_6h_avg: Optional[float] = None,
    cpu_7d_p95: Optional[float] = None,
    memory_7d_avg: Optional[float] = None,
    traffic_3m_avg: Optional[float] = None,
    traffic_60m_avg: Optional[float] = None,
    traffic_below_baseline_6h: bool = False,
    cpu_below_5pct_3d: bool = False,
    storage_utilization: Optional[float] = None,
) -> list[RecommendationCalcResult]:
    """Evaluate metric patterns and return valid recommendations.

    Args:
        resource_name: Human readable name
        provider: 'AWS', 'AZURE', 'GCP'
        resource_type: 'COMPUTE', 'DATABASE', 'CONTAINER', etc.
        current_size: e.g. 't3.medium'
        current_quantity: current instance count
        min_quantity: min safety bound
        max_quantity: max safety bound
        supported_actions: list of ActionTypes allowed on resource
        current_storage_gb: storage in GB
        cpu_3m_avg: average CPU over last 3 min
        cpu_6h_avg: average CPU over last 6 hours
        cpu_7d_p95: p95 CPU over last 7 days
        memory_7d_avg: average memory over last 7 days
        traffic_3m_avg: average request_rate over last 3 min
        traffic_60m_avg: average request_rate over preceding 60 min
        traffic_below_baseline_6h: True if traffic remained below baseline for 6h
        cpu_below_5pct_3d: True if CPU < 5% for 3 days
        storage_utilization: storage % used

    Returns:
        List of generated RecommendationCalcResult objects
    """
    recs: list[RecommendationCalcResult] = []

    # 1. SCALE_UP check
    if "SCALE_OUT" in supported_actions:
        cpu_trigger = cpu_3m_avg is not None and cpu_3m_avg > 75.0
        traffic_trigger = (
            traffic_3m_avg is not None
            and traffic_60m_avg is not None
            and traffic_60m_avg > 0
            and (traffic_3m_avg / traffic_60m_avg) > 1.5
        )

        if cpu_trigger or traffic_trigger:
            cpu_val = cpu_3m_avg if cpu_3m_avg is not None else 75.0
            scale_factor = min(2.0, max(1.25, cpu_val / 60.0))
            target_qty = math.ceil(current_quantity * scale_factor)
            target_qty = min(max_quantity, target_qty)

            if target_qty > current_quantity:
                reasons = []
                if cpu_trigger:
                    reasons.append({
                        "metric": "cpu_utilization",
                        "observed": round(cpu_val, 2),
                        "threshold": 75.0,
                        "window": "3m",
                    })
                if traffic_trigger and traffic_3m_avg and traffic_60m_avg:
                    reasons.append({
                        "metric": "request_rate",
                        "observed": round(traffic_3m_avg, 2),
                        "threshold": round(traffic_60m_avg * 1.5, 2),
                        "window": "3m",
                    })

                confidence = min(95, int(60 + min(35, (cpu_val - 75.0) * 1.5)))

                recs.append(
                    RecommendationCalcResult(
                        recommendation_type="SCALE_UP",
                        title=f"Scale out {resource_name}",
                        summary=f"Traffic/CPU spike detected on {resource_name}. Scale out from {current_quantity} to {target_qty} instances to handle demand.",
                        severity="WARNING" if cpu_val > 85.0 else "INFO",
                        confidence=confidence,
                        proposed_action=ProposedActionCalc(
                            action_type="SCALE_OUT",
                            params={"targetInstances": target_qty},
                        ),
                        reasons=reasons,
                    )
                )

    # 2. SCALE_DOWN check
    if "SCALE_IN" in supported_actions and not recs:
        if cpu_6h_avg is not None and cpu_6h_avg < 25.0 and traffic_below_baseline_6h:
            step_target = math.ceil(current_quantity * (cpu_6h_avg / 50.0))
            target_qty = max(min_quantity, min(current_quantity - 1, step_target))

            if target_qty < current_quantity:
                recs.append(
                    RecommendationCalcResult(
                        recommendation_type="SCALE_DOWN",
                        title=f"Scale in {resource_name}",
                        summary=f"{resource_name} has been underutilized (CPU < 25%) for 6h. Scale in from {current_quantity} to {target_qty} instances to save costs.",
                        severity="INFO",
                        confidence=85,
                        proposed_action=ProposedActionCalc(
                            action_type="SCALE_IN",
                            params={"targetInstances": target_qty},
                        ),
                        reasons=[{
                            "metric": "cpu_utilization",
                            "observed": round(cpu_6h_avg, 2),
                            "threshold": 25.0,
                            "window": "6h",
                        }],
                    )
                )

    # 3. RIGHT_SIZE check
    if "RESIZE" in supported_actions and not recs:
        cpu_low = cpu_7d_p95 is not None and cpu_7d_p95 < 40.0
        mem_low = memory_7d_avg is None or memory_7d_avg < 40.0

        if cpu_low and mem_low:
            smaller_size = get_next_smaller_size(provider, resource_type, current_size)
            if smaller_size and smaller_size != current_size:
                recs.append(
                    RecommendationCalcResult(
                        recommendation_type="RIGHT_SIZE",
                        title=f"Right-size {resource_name}",
                        summary=f"{resource_name} CPU p95 has remained under 40% for 7 days. Downsize from {current_size} to {smaller_size}.",
                        severity="INFO",
                        confidence=90,
                        proposed_action=ProposedActionCalc(
                            action_type="RESIZE",
                            params={"targetSize": smaller_size},
                        ),
                        reasons=[{
                            "metric": "cpu_utilization",
                            "observed": round(cpu_7d_p95, 2),
                            "threshold": 40.0,
                            "window": "7d",
                        }],
                    )
                )

    # 4. COST_OPTIMIZATION check (Idle STOP)
    if "STOP" in supported_actions and not recs:
        if cpu_below_5pct_3d:
            recs.append(
                RecommendationCalcResult(
                    recommendation_type="COST_OPTIMIZATION",
                    title=f"Stop idle resource {resource_name}",
                    summary=f"{resource_name} has had < 5% CPU for 3 days. Stop resource to eliminate compute cost.",
                    severity="WARNING",
                    confidence=95,
                    proposed_action=ProposedActionCalc(
                        action_type="STOP",
                        params={},
                    ),
                    reasons=[{
                        "metric": "cpu_utilization",
                        "observed": 2.5,
                        "threshold": 5.0,
                        "window": "3d",
                    }],
                )
            )

    # 5. RESOURCE_ALLOCATION check (Storage Expansion)
    if "EXPAND_STORAGE" in supported_actions and not recs:
        if storage_utilization is not None and storage_utilization > 80.0:
            curr_gb = current_storage_gb or 500.0
            target_gb = math.ceil(curr_gb * 1.25)

            recs.append(
                RecommendationCalcResult(
                    recommendation_type="RESOURCE_ALLOCATION",
                    title=f"Expand storage for {resource_name}",
                    summary=f"Storage utilization on {resource_name} reached {storage_utilization:.1f}% (> 80%). Expand storage from {curr_gb:.0f} GB to {target_gb:.0f} GB.",
                    severity="WARNING",
                    confidence=90,
                    proposed_action=ProposedActionCalc(
                        action_type="EXPAND_STORAGE",
                        params={"targetStorageGb": target_gb},
                    ),
                    reasons=[{
                        "metric": "storage_utilization",
                        "observed": round(storage_utilization, 2),
                        "threshold": 80.0,
                        "window": "1h",
                    }],
                )
            )

    return recs
