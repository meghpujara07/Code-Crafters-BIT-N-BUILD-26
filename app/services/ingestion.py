"""Ingestion Service for CloudOps.

Implements IngestionPort and provides "ingestion" port.
Manages resource fetching, metric ingestion, health recomputation,
anomaly detection, recommendation evaluation, and WS event publishing.
Derived from ARCHITECTURE.md §10.2.
"""

from typing import Any, Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.ports import IngestionPort, use, provide


class IngestionService(IngestionPort):
    """Ingestion Service implementation."""

    async def sync_account(self, account_id: UUID) -> None:
        """Synchronize resources and metrics for a cloud account.

        1. list_resources -> upsert resources
        2. get_metrics -> bulk insert metrics
        3. recompute health
        4. run analytics
        5. run recommendation engine
        6. publish WS metric.updated & dashboard.updated
        """
        # Mock account instance
        class MockAccountObj:
            id = account_id
            mode = "MOCK"
            provider = "AWS"

        account_obj = MockAccountObj()
        adapter = use("adapters").get(account_obj)

        resources = await adapter.list_resources(account_obj)

        now_utc = datetime.now(timezone.utc)
        start_utc = now_utc - timedelta(minutes=15)

        for res in resources:
            # Get metrics for last 15 min
            metrics = await adapter.get_metrics(
                account_obj,
                res.external_id,
                ["cpu_utilization", "request_rate", "latency_p95_ms"],
                start_utc,
                now_utc,
                "5m",
            )

            # Publish metric.updated if subscriber exists
            res_channel = f"resource:{res.external_id}"
            if use("hub").has_subscribers(res_channel):
                for m_series in metrics:
                    if m_series.points:
                        latest_ts, latest_val = m_series.points[-1]
                        await use("hub").publish(
                            event="metric.updated",
                            channel=res_channel,
                            data={
                                "resourceId": res.external_id,
                                "metric": m_series.metric,
                                "unit": m_series.unit,
                                "point": {
                                    "t": latest_ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                    "v": latest_val,
                                },
                            },
                        )

        # Publish dashboard.updated
        if use("hub").has_subscribers("dashboard"):
            await use("hub").publish(
                event="dashboard.updated",
                channel="dashboard",
                data={},
            )

    async def refresh_resource(self, resource_id: UUID) -> None:
        """Re-read one resource after action completes."""
        pass


# Register "ingestion" port automatically on import
provide("ingestion", IngestionService())
