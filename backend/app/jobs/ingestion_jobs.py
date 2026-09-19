"""APScheduler Ingestion Jobs for CloudOps.

Registers periodic ingestion and maintenance jobs per ARCHITECTURE.md §10.2 and §16.4.
"""

from typing import Any
from app.ports import use


async def run_ingestion_cycle() -> None:
    """Run ingestion cycle for all connected accounts."""
    # Stub account UUID for scheduled sync
    from uuid import UUID

    dummy_account_id = UUID("00000000-0000-0000-0000-000000000001")
    await use("ingestion").sync_account(dummy_account_id)


def register(scheduler: Any) -> None:
    """Register jobs with the APScheduler instance.

    Conforms to auto-discovery convention in ARCHITECTURE.md §16.4.
    """
    if hasattr(scheduler, "add_job"):
        scheduler.add_job(
            run_ingestion_cycle,
            "interval",
            seconds=60,
            id="ingestion_cycle_job",
            replace_existing=True,
        )
