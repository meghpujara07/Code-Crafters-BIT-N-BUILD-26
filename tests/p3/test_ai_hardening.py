import pytest

from app.services.ai.client import RateLimiter
from app.services.ai.tools import AI_TOOL_REGISTRY
from app.services.ai.templates import generate_fallback_chat_reply


def test_rate_limiter_allows_20_then_blocks():
    limiter = RateLimiter(limit=20, window_seconds=60)
    assert [limiter.is_rate_limited("u") for _ in range(20)] == [False] * 20
    assert limiter.is_rate_limited("u") is True


def test_ai_tools_are_all_read_only():
    tools = {t["name"] for t in AI_TOOL_REGISTRY.list_tools()}
    assert tools == {
        "get_dashboard",
        "list_resources",
        "get_resource_metrics",
        "get_costs",
        "list_recommendations",
        "preview_action",
    }
    assert all(AI_TOOL_REGISTRY.is_read_only(name) for name in tools)


@pytest.mark.asyncio
async def test_fallback_chat_is_deterministic_and_has_no_execution():
    reply = generate_fallback_chat_reply("scale checkout-api")
    assert "unavailable" in reply.reply.lower()
    assert reply.suggested_actions == []


def test_forecast_helper_empty_input():
    from app.services.cost_forecast_c3 import forecast_costs
    assert forecast_costs([], 30) == []
