import asyncio
import time

from app.api.v1.resources import list_resources
from app.services.analytics import AnalyticsService


def test_resources_list_under_300ms():
    start = time.perf_counter()

    result = asyncio.run(
        list_resources(page=1, page_size=20)
    )

    elapsed_ms = (time.perf_counter() - start) * 1000

    assert len(result.data) == 14
    assert elapsed_ms < 300


def test_budget_threshold_alerts():
    service = AnalyticsService()

    crossed = asyncio.run(
        service.raise_budget_threshold_alerts(
            db=None,
            budget_name="Production AWS",
            amount_usd=1000,
            used_usd=850,
            alert_thresholds=[50, 80, 100],
            month="2026-09",
        )
    )

    assert crossed == [50, 80]