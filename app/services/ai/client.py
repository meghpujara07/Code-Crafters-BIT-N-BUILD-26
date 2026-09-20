"""LLM client and bounded tool-calling loop for CloudOps C3.

The LLM is strictly an explanation/summarization/Q&A layer. It never executes
write operations. Context is obtained through the platform's HTTP API using
the caller's bearer token.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import asyncio
import os
from typing import Any, Optional

import httpx

from app.services.ai.tools import AI_TOOL_REGISTRY


class LlmClient(ABC):
    @abstractmethod
    async def complete(
        self,
        system_prompt: str,
        messages: list[dict[str, Any]],
        tools: Optional[list[dict[str, Any]]] = None,
        tool_executor: Any = None,
        bearer_token: Optional[str] = None,
    ) -> str:
        """Return the model's final text; empty string means unavailable/failed."""


class AnthropicLlmClient(LlmClient):
    """Anthropic Messages API client with a hard 15-second request budget."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("LLM_API_KEY")
        self.model = model or os.getenv("LLM_MODEL", "claude-3-5-sonnet-20241022")
        self.base_url = os.getenv("LLM_API_BASE", "https://api.anthropic.com/v1/messages")
        self.timeout_seconds = 15.0

    async def complete(
        self,
        system_prompt: str,
        messages: list[dict[str, Any]],
        tools: Optional[list[dict[str, Any]]] = None,
        tool_executor: Any = None,
        bearer_token: Optional[str] = None,
    ) -> str:
        if not self.api_key:
            return ""

        request_messages = list(messages)
        deadline = 15.0

        try:
            async with httpx.AsyncClient(timeout=deadline) as client:
                for _ in range(3):
                    payload: dict[str, Any] = {
                        "model": self.model,
                        "max_tokens": 1200,
                        "system": system_prompt,
                        "messages": request_messages,
                    }
                    if tools:
                        payload["tools"] = tools

                    response = await asyncio.wait_for(
                        client.post(
                            self.base_url,
                            headers={
                                "x-api-key": self.api_key,
                                "anthropic-version": "2023-06-01",
                                "content-type": "application/json",
                            },
                            json=payload,
                        ),
                        timeout=deadline,
                    )
                    response.raise_for_status()
                    data = response.json()
                    content = data.get("content", [])
                    text_parts = [b.get("text", "") for b in content if b.get("type") == "text"]
                    tool_uses = [b for b in content if b.get("type") == "tool_use"]

                    if not tool_uses or tool_executor is None:
                        return "\n".join(p for p in text_parts if p).strip()

                    request_messages.append({"role": "assistant", "content": content})
                    results = []
                    for call in tool_uses:
                        result = await tool_executor.execute(
                            call["name"], call.get("input") or {}, bearer_token=bearer_token
                        )
                        results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": call["id"],
                                "content": result,
                            }
                        )
                    request_messages.append({"role": "user", "content": results})

            return ""
        except (asyncio.TimeoutError, httpx.HTTPError, ValueError, KeyError):
            return ""
        except Exception:
            return ""


class RateLimiter:
    """In-memory 20 requests/minute/user limiter."""

    def __init__(self, limit: int = 20, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self.user_requests: dict[str, list[datetime]] = {}

    def is_rate_limited(self, user_id: str) -> bool:
        now = datetime.now(timezone.utc)
        cutoff = now.timestamp() - self.window_seconds
        valid = [t for t in self.user_requests.get(user_id, []) if t.timestamp() >= cutoff]
        if len(valid) >= self.limit:
            self.user_requests[user_id] = valid
            return True
        valid.append(now)
        self.user_requests[user_id] = valid
        return False


AI_RATE_LIMITER = RateLimiter()
