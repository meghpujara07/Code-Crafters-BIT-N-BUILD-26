"""Unit tests for ingestion.py service."""

import pytest
from uuid import UUID
from app.services.ingestion import IngestionService
from app.ports import use


@pytest.mark.asyncio
async def test_sync_account():
    ingestion = IngestionService()
    account_id = UUID("00000000-0000-0000-0000-000000000001")

    # Should execute sync without errors using ports
    await ingestion.sync_account(account_id)


@pytest.mark.asyncio
async def test_refresh_resource():
    ingestion = IngestionService()
    resource_id = UUID("b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30")

    await ingestion.refresh_resource(resource_id)
