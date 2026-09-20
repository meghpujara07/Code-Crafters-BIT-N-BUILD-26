"""Unit tests for Person 3 read router endpoints."""

import pytest
from app.api.v1.dashboard import get_dashboard_overview
from app.api.v1.resources import list_resources, get_resource_by_id
from app.api.v1.metrics import get_metrics_summary, get_metrics_timeseries
from app.api.v1.costs import get_costs_summary, get_costs_breakdown
from app.api.v1.billing import get_billing_statements
from app.api.v1.anomalies import list_anomalies
from app.api.v1.analytics import get_analytics_trends


@pytest.mark.asyncio
async def test_dashboard_overview_endpoint():
    res = await get_dashboard_overview()
    assert res.success is True
    assert res.data.resources.total == 14
    assert res.data.cost.month_to_date_usd == 1879.42


@pytest.mark.asyncio
async def test_resources_list_endpoint():
    res = await list_resources(page=1, page_size=20)
    assert res.success is True
    assert len(res.data) == 14
    assert res.meta.total == 14


@pytest.mark.asyncio
async def test_resource_by_id_endpoint():
    res = await get_resource_by_id("b4a2e0d1-0c3e-4f6a-8d75-2f7c9a1e5b30")
    assert res.success is True
    assert res.data.name == "checkout-api"
    assert res.data.quantity == 4


@pytest.mark.asyncio
async def test_metrics_endpoints():
    summary = await get_metrics_summary()
    assert summary.success is True
    assert summary.data.traffic.avg == 1840.5

    ts = await get_metrics_timeseries()
    assert ts.success is True
    assert len(ts.data.series) > 0


@pytest.mark.asyncio
async def test_costs_endpoints():
    summary = await get_costs_summary()
    assert summary.success is True
    assert summary.data.currency == "USD"

    breakdown = await get_costs_breakdown()
    assert breakdown.success is True
    assert len(breakdown.data) > 0


@pytest.mark.asyncio
async def test_billing_endpoints():
    stmts = await get_billing_statements()
    assert stmts.success is True
    assert len(stmts.data) > 0


@pytest.mark.asyncio
async def test_anomalies_and_trends_endpoints():
    anoms = await list_anomalies()
    assert anoms.success is True
    assert len(anoms.data) > 0

    trends = await get_analytics_trends()
    assert trends.success is True
    assert trends.data.direction == "UP"
