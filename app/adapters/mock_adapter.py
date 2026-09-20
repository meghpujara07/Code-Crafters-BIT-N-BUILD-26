"""Mock Cloud Adapter for AWS, Azure, and GCP.

Generates normalized resources, metric series, and cost records for mock cloud accounts.
Derived from ARCHITECTURE.md §10.1 and §11.
"""

import asyncio
from datetime import datetime, date, timedelta, timezone
from typing import Any, Optional
from uuid import uuid4

from app.ports import (
    CloudProviderAdapter,
    ValidationOutcome,
    NormalizedResource,
    MetricSeriesData,
    CostRecord,
    ProviderOperation,
)
from app.adapters.mock_generator import generate_metric_value, RESOURCE_PROFILES
from app.adapters.price_catalog import get_hourly_price, get_storage_price_per_gb_month


# 14 Seeded resources from ARCHITECTURE.md §11
SEEDED_RESOURCES: list[dict[str, Any]] = [
    {
        "external_id": "b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30",
        "name": "checkout-api",
        "provider": "AWS",
        "type": "COMPUTE",
        "region": "us-east-1",
        "status": "RUNNING",
        "size": "t3.medium",
        "quantity": 4,
        "min_quantity": 2,
        "max_quantity": 10,
        "supported_actions": ["SCALE_OUT", "SCALE_IN", "RESIZE", "STOP", "START"],
        "storage_gb": None,
        "tags": {"env": "prod", "service": "checkout"},
    },
    {
        "external_id": "res-aws-worker-pool",
        "name": "worker-pool",
        "provider": "AWS",
        "type": "COMPUTE",
        "region": "us-east-1",
        "status": "RUNNING",
        "size": "t3.large",
        "quantity": 3,
        "min_quantity": 1,
        "max_quantity": 8,
        "supported_actions": ["SCALE_OUT", "SCALE_IN", "RESIZE"],
        "storage_gb": None,
        "tags": {"env": "prod", "tier": "backend"},
    },
    {
        "external_id": "res-aws-staging-api",
        "name": "staging-api",
        "provider": "AWS",
        "type": "COMPUTE",
        "region": "us-west-2",
        "status": "RUNNING",
        "size": "t3.small",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 2,
        "supported_actions": ["SCALE_OUT", "SCALE_IN", "RESIZE", "STOP", "START"],
        "storage_gb": None,
        "tags": {"env": "staging"},
    },
    {
        "external_id": "res-aws-orders-db",
        "name": "orders-db",
        "provider": "AWS",
        "type": "DATABASE",
        "region": "us-east-1",
        "status": "RUNNING",
        "size": "db.r5.large",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": ["EXPAND_STORAGE"],
        "storage_gb": 500.0,
        "tags": {"env": "prod", "db": "postgres"},
    },
    {
        "external_id": "res-aws-assets-bucket",
        "name": "assets-bucket",
        "provider": "AWS",
        "type": "STORAGE",
        "region": "us-east-1",
        "status": "RUNNING",
        "size": "s3-standard",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": [],
        "storage_gb": 2000.0,
        "tags": {"env": "prod"},
    },
    {
        "external_id": "res-aws-web-alb",
        "name": "web-alb",
        "provider": "AWS",
        "type": "LOAD_BALANCER",
        "region": "us-east-1",
        "status": "RUNNING",
        "size": "alb",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": [],
        "storage_gb": None,
        "tags": {"env": "prod"},
    },
    {
        "external_id": "res-az-billing-api",
        "name": "billing-api",
        "provider": "AZURE",
        "type": "COMPUTE",
        "region": "eastus",
        "status": "RUNNING",
        "size": "Standard_D2s_v3",
        "quantity": 3,
        "min_quantity": 2,
        "max_quantity": 8,
        "supported_actions": ["SCALE_OUT", "SCALE_IN", "RESIZE"],
        "storage_gb": None,
        "tags": {"env": "prod", "billing": "core"},
    },
    {
        "external_id": "res-az-aks-workers",
        "name": "aks-workers",
        "provider": "AZURE",
        "type": "CONTAINER",
        "region": "eastus",
        "status": "RUNNING",
        "size": "Standard_D4s_v3",
        "quantity": 5,
        "min_quantity": 3,
        "max_quantity": 12,
        "supported_actions": ["SCALE_OUT", "SCALE_IN"],
        "storage_gb": None,
        "tags": {"env": "prod", "k8s": "aks"},
    },
    {
        "external_id": "res-az-reports-db",
        "name": "reports-db",
        "provider": "AZURE",
        "type": "DATABASE",
        "region": "westeurope",
        "status": "RUNNING",
        "size": "GP_Gen5_4",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": ["RESIZE", "EXPAND_STORAGE"],
        "storage_gb": 300.0,
        "tags": {"env": "prod"},
    },
    {
        "external_id": "res-az-media-storage",
        "name": "media-storage",
        "provider": "AZURE",
        "type": "STORAGE",
        "region": "eastus",
        "status": "RUNNING",
        "size": "blob-hot",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": [],
        "storage_gb": 3000.0,
        "tags": {"env": "prod"},
    },
    {
        "external_id": "res-gcp-search-svc",
        "name": "search-svc",
        "provider": "GCP",
        "type": "COMPUTE",
        "region": "us-central1",
        "status": "RUNNING",
        "size": "e2-standard-2",
        "quantity": 2,
        "min_quantity": 1,
        "max_quantity": 6,
        "supported_actions": ["SCALE_OUT", "SCALE_IN", "RESIZE"],
        "storage_gb": None,
        "tags": {"env": "prod", "svc": "search"},
    },
    {
        "external_id": "res-gcp-gke-batch",
        "name": "gke-batch",
        "provider": "GCP",
        "type": "CONTAINER",
        "region": "us-central1",
        "status": "RUNNING",
        "size": "n2-standard-4",
        "quantity": 3,
        "min_quantity": 1,
        "max_quantity": 10,
        "supported_actions": ["SCALE_OUT", "SCALE_IN"],
        "storage_gb": None,
        "tags": {"env": "prod"},
    },
    {
        "external_id": "res-gcp-cache-redis",
        "name": "cache-redis",
        "provider": "GCP",
        "type": "DATABASE",
        "region": "us-central1",
        "status": "RUNNING",
        "size": "m1-standard",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": [],
        "storage_gb": None,
        "tags": {"env": "prod"},
    },
    {
        "external_id": "res-gcp-gcs-backups",
        "name": "gcs-backups",
        "provider": "GCP",
        "type": "STORAGE",
        "region": "us-central1",
        "status": "RUNNING",
        "size": "gcs-nearline",
        "quantity": 1,
        "min_quantity": 1,
        "max_quantity": 1,
        "supported_actions": [],
        "storage_gb": 4000.0,
        "tags": {"env": "prod"},
    },
]


class MockAdapter(CloudProviderAdapter):
    """Mock Cloud Provider Adapter serving AWS, Azure, and GCP resources."""

    def __init__(self, provider: str = "AWS"):
        self.provider = provider.upper()

    async def validate_credentials(self, acc: Any) -> ValidationOutcome:
        return ValidationOutcome(ok=True, message=f"Mock credentials for {self.provider} validated")

    async def list_resources(self, acc: Any) -> list[NormalizedResource]:
        account_provider = getattr(acc, "provider", self.provider).upper()

        matching = [
            NormalizedResource(
                external_id=r["external_id"],
                name=r["name"],
                type=r["type"],
                region=r["region"],
                status=r["status"],
                size=r["size"],
                quantity=r["quantity"],
                min_quantity=r["min_quantity"],
                max_quantity=r["max_quantity"],
                supported_actions=r["supported_actions"],
                storage_gb=r["storage_gb"],
                tags=r["tags"].copy(),
            )
            for r in SEEDED_RESOURCES
            if r["provider"] == account_provider
        ]

        # If a mock account has no resources, create 3 default resources
        if not matching:
            p_lower = account_provider.lower()
            matching = [
                NormalizedResource(
                    external_id=f"res-{p_lower}-vm",
                    name=f"{p_lower}-compute-app",
                    type="COMPUTE",
                    region="us-east-1" if account_provider == "AWS" else "eastus",
                    status="RUNNING",
                    size="t3.medium" if account_provider == "AWS" else "Standard_D2s_v3",
                    quantity=2,
                    min_quantity=1,
                    max_quantity=5,
                    supported_actions=["SCALE_OUT", "SCALE_IN", "RESIZE"],
                    storage_gb=None,
                    tags={"env": "dev"},
                ),
                NormalizedResource(
                    external_id=f"res-{p_lower}-db",
                    name=f"{p_lower}-main-db",
                    type="DATABASE",
                    region="us-east-1" if account_provider == "AWS" else "eastus",
                    status="RUNNING",
                    size="db.r5.large" if account_provider == "AWS" else "GP_Gen5_2",
                    quantity=1,
                    min_quantity=1,
                    max_quantity=1,
                    supported_actions=["EXPAND_STORAGE"],
                    storage_gb=200.0,
                    tags={"env": "dev"},
                ),
                NormalizedResource(
                    external_id=f"res-{p_lower}-bucket",
                    name=f"{p_lower}-store",
                    type="STORAGE",
                    region="us-east-1" if account_provider == "AWS" else "eastus",
                    status="RUNNING",
                    size="s3-standard" if account_provider == "AWS" else "blob-hot",
                    quantity=1,
                    min_quantity=1,
                    max_quantity=1,
                    supported_actions=[],
                    storage_gb=500.0,
                    tags={"env": "dev"},
                ),
            ]

        return matching

    async def get_metrics(
        self, acc: Any, external_id: str, metrics: list[str], start: datetime, end: datetime, interval: str
    ) -> list[MetricSeriesData]:
        res_info = next((r for r in SEEDED_RESOURCES if r["external_id"] == external_id), None)
        res_name = res_info["name"] if res_info else external_id
        qty = res_info["quantity"] if res_info else 1

        # Step minutes based on interval
        step_minutes = 5
        if interval == "1m":
            step_minutes = 1
        elif interval == "15m":
            step_minutes = 15
        elif interval == "1h":
            step_minutes = 60
        elif interval == "1d":
            step_minutes = 1440

        result: list[MetricSeriesData] = []

        for metric in metrics:
            points: list[tuple[datetime, float]] = []
            curr = start
            unit = "%"
            if "request" in metric:
                unit = "req/s"
            elif "latency" in metric:
                unit = "ms"
            elif "gb" in metric:
                unit = "gb"
            elif "mbps" in metric:
                unit = "mbps"
            elif "count" in metric:
                unit = "count"

            while curr <= end:
                val = generate_metric_value(res_name, metric, curr, quantity=qty)
                points.append((curr, val))
                curr += timedelta(minutes=step_minutes)

            result.append(MetricSeriesData(metric=metric, unit=unit, points=points))

        return result

    async def get_costs(self, acc: Any, start: date, end: date) -> list[CostRecord]:
        account_provider = getattr(acc, "provider", self.provider).upper()
        records: list[CostRecord] = []

        resources = [r for r in SEEDED_RESOURCES if r["provider"] == account_provider]

        curr = start
        while curr <= end:
            for r in resources:
                hourly = get_hourly_price(r["provider"], r["type"], r["size"])
                daily_compute = hourly * 24.0 * r["quantity"]
                storage_rate = get_storage_price_per_gb_month(r["provider"], r["type"], r["size"])
                daily_storage = ((r["storage_gb"] or 0.0) * storage_rate) / 30.0

                daily_total = round(daily_compute + daily_storage, 2)
                if daily_total > 0:
                    records.append(
                        CostRecord(
                            service=r["name"],
                            usage_date=curr,
                            amount_usd=daily_total,
                            resource_external_id=r["external_id"],
                            tags=r["tags"].copy(),
                        )
                    )

            curr += timedelta(days=1)

        return records

    async def execute(self, acc: Any, external_id: str, action_type: str, params: dict) -> ProviderOperation:
        op_id = f"op-{uuid4().hex[:8]}"
        # Simulated execution delay
        await asyncio.sleep(0.01)
        return ProviderOperation(operation_id=op_id, state="SUCCEEDED", message=f"{action_type} executed on {external_id}")

    async def get_operation_status(self, acc: Any, operation_id: str) -> ProviderOperation:
        return ProviderOperation(operation_id=operation_id, state="SUCCEEDED", message="Operation finished successfully")
