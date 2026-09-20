"""AI request/response schemas from ARCHITECTURE.md §6.4 and §7.12."""

from typing import Any, Literal
from app.schemas.base import CamelModel


class SuggestedAction(CamelModel):
    label: str
    type: Literal["OPEN_RESOURCE", "OPEN_RECOMMENDATION", "PREVIEW_ACTION"]
    payload: dict[str, Any]


class AiExplanation(CamelModel):
    explanation: str
    key_points: list[str] = []
    generated_at: str


class AiSummary(CamelModel):
    summary: str
    highlights: list[str] = []
    generated_at: str


class AiChatReply(CamelModel):
    conversation_id: str
    reply: str
    suggested_actions: list[SuggestedAction] = []


class AiExplainRequest(CamelModel):
    entity_type: Literal["RECOMMENDATION", "ACTION", "ANOMALY"]
    entity_id: str


class AiSummarizeRequest(CamelModel):
    scope: Literal["DASHBOARD", "COSTS", "RESOURCE"]
    resource_id: str | None = None
    from_: str | None = None
    to: str | None = None


class AiChatRequest(CamelModel):
    message: str
    conversation_id: str | None = None
