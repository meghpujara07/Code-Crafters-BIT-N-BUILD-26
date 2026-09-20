"""Read-only AI API. LLM failures degrade to deterministic templates."""

from datetime import datetime, timezone
import json
from typing import Optional

import httpx
from fastapi import APIRouter, Header, HTTPException

from app.schemas.base import ApiResponse
from app.schemas.ai import AiChatRequest, AiChatReply, AiSummarizeRequest, AiSummary, AiExplainRequest, AiExplanation
from app.services.ai.client import AnthropicLlmClient, AI_RATE_LIMITER
from app.services.ai.templates import generate_fallback_chat_reply, generate_fallback_summary, generate_fallback_explanation
from app.services.ai.tools import AI_TOOL_REGISTRY

router = APIRouter(tags=["ai"])


def _check_rate_limit(authorization: Optional[str]) -> str:
    user_id = authorization or "anonymous"
    if AI_RATE_LIMITER.is_rate_limited(user_id):
        raise HTTPException(status_code=429, detail={"code": "RATE_LIMITED", "message": "AI rate limit exceeded (max 20 requests per minute)."})
    return user_id


async def _get_context(path: str, authorization: Optional[str], params: dict | None = None) -> dict:
    base = __import__("os").getenv("INTERNAL_API_BASE", "http://127.0.0.1:8000/api/v1").rstrip("/")
    headers = {"Authorization": authorization} if authorization else {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{base}/{path.lstrip('/')}", params=params or {}, headers=headers)
            response.raise_for_status()
            return response.json()
    except Exception:
        return {}


def _client() -> AnthropicLlmClient:
    return AnthropicLlmClient()


@router.post("/ai/explain", response_model=ApiResponse[AiExplanation])
async def ai_explain(body: AiExplainRequest, authorization: Optional[str] = Header(None)) -> ApiResponse[AiExplanation]:
    _check_rate_limit(authorization)
    # context = await _get_context(f"{body.entity_type.lower()}s/{body.entity_id}", authorization)
    entity_paths = {
        "RECOMMENDATION": "recommendations",
        "ACTION": "actions",
        "ANOMALY": "anomalies",
    }
    context = await _get_context(
        f"{entity_paths[body.entity_type]}/{body.entity_id}",
        authorization,
    )
    prompt = (
        "Explain the supplied CloudOps entity for an operator. Use only values present in the JSON context. "
        "Do not invent or recalculate numbers. Never instruct the user to execute an action directly."
    )
    text = await _client().complete(prompt, [{"role": "user", "content": json.dumps(context, default=str)}])
    if not text:
        return ApiResponse(data=generate_fallback_explanation(resource_name=body.entity_id))
    return ApiResponse(data=AiExplanation(explanation=text, key_points=[], generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")))


@router.post("/ai/summarize", response_model=ApiResponse[AiSummary])
async def ai_summarize(body: AiSummarizeRequest, authorization: Optional[str] = Header(None)) -> ApiResponse[AiSummary]:
    _check_rate_limit(authorization)
    if body.scope == "DASHBOARD":
        path, params = "dashboard/overview", {}
    elif body.scope == "COSTS":
        path, params = "costs/summary", {}
    else:
        if not body.resource_id:
            return ApiResponse(data=generate_fallback_summary(scope=body.scope))
        path, params = f"resources/{body.resource_id}", {}
    context = await _get_context(path, authorization, params)
    prompt = "Summarize this CloudOps JSON for an operator. Use only supplied values; never invent numbers or execute actions."
    text = await _client().complete(prompt, [{"role": "user", "content": json.dumps(context, default=str)}])
    if not text:
        return ApiResponse(data=generate_fallback_summary(scope=body.scope))
    return ApiResponse(data=AiSummary(summary=text, highlights=[], generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")))


@router.post("/ai/chat", response_model=ApiResponse[AiChatReply])
async def ai_chat(body: AiChatRequest, authorization: Optional[str] = Header(None)) -> ApiResponse[AiChatReply]:
    _check_rate_limit(authorization)
    system = (
        "You are the CloudOps read-only assistant. Use only read-only tools. "
        "Never execute a write operation. Numbers must come from tool/API results. "
        "You may suggest an action, but the user must use the normal /actions flow."
    )
    messages = [{"role": "user", "content": body.message}]
    text = await _client().complete(
        system,
        messages,
        tools=AI_TOOL_REGISTRY.list_tools(),
        tool_executor=AI_TOOL_REGISTRY,
        bearer_token=authorization,
    )
    if not text:
        return ApiResponse(data=generate_fallback_chat_reply(body.message, body.conversation_id))
    return ApiResponse(data=AiChatReply(conversation_id=body.conversation_id or f"conv-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}", reply=text, suggested_actions=[]))
