"""Read-only AI tools executed through the platform's own REST API."""

from typing import Any
import os

import httpx


class AiToolRegistry:
    def __init__(self) -> None:
        self._tools = {
            "get_dashboard": {
                "name": "get_dashboard",
                "description": "Get dashboard overview KPIs, resource counts and cost summary.",
                "input_schema": {"type": "object", "properties": {}, "additionalProperties": False},
                "read_only": True,
            },
            "list_resources": {
                "name": "list_resources",
                "description": "List infrastructure resources with optional provider/type/search filters.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "provider": {"type": "string"},
                        "type": {"type": "string"},
                        "search": {"type": "string"},
                    },
                    "additionalProperties": False,
                },
                "read_only": True,
            },
            "get_resource_metrics": {
                "name": "get_resource_metrics",
                "description": "Get metrics for one resource.",
                "input_schema": {
                    "type": "object",
                    "properties": {"resourceId": {"type": "string"}, "metric": {"type": "string"}},
                    "required": ["resourceId"],
                    "additionalProperties": False,
                },
                "read_only": True,
            },
            "get_costs": {
                "name": "get_costs",
                "description": "Get the current cost summary and forecast.",
                "input_schema": {"type": "object", "properties": {}, "additionalProperties": False},
                "read_only": True,
            },
            "list_recommendations": {
                "name": "list_recommendations",
                "description": "List current recommendations. This is read-only.",
                "input_schema": {
                    "type": "object",
                    "properties": {"resourceId": {"type": "string"}},
                    "additionalProperties": False,
                },
                "read_only": True,
            },
            "preview_action": {
                "name": "preview_action",
                "description": "Dry-run an action through POST /actions/preview. It changes nothing and writes no audit row.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "resourceId": {"type": "string"},
                        "type": {"type": "string"},
                        "params": {"type": "object"},
                    },
                    "required": ["resourceId", "type", "params"],
                    "additionalProperties": False,
                },
                "read_only": True,
            },
        }

    def list_tools(self) -> list[dict[str, Any]]:
        return list(self._tools.values())

    def is_read_only(self, tool_name: str) -> bool:
        return bool(self._tools.get(tool_name, {}).get("read_only"))

    async def execute(self, tool_name: str, args: dict[str, Any], bearer_token: str | None) -> str:
        if not self.is_read_only(tool_name):
            return "Tool rejected: only read-only tools are permitted."

        base = os.getenv("INTERNAL_API_BASE", "http://127.0.0.1:8000/api/v1").rstrip("/")
        headers = {"Authorization": bearer_token} if bearer_token else {}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                if tool_name == "get_dashboard":
                    response = await client.get(f"{base}/dashboard/overview", headers=headers)
                elif tool_name == "list_resources":
                    params = {k: v for k, v in args.items() if v is not None}
                    response = await client.get(f"{base}/resources", params=params, headers=headers)
                elif tool_name == "get_resource_metrics":
                    rid = args["resourceId"]
                    params = {"metric": args["metric"]} if args.get("metric") else {}
                    response = await client.get(f"{base}/resources/{rid}/metrics", params=params, headers=headers)
                elif tool_name == "get_costs":
                    response = await client.get(f"{base}/costs/summary", headers=headers)
                    if response.is_success:
                        return response.text
                    response = await client.get(f"{base}/costs/forecast", headers=headers)
                elif tool_name == "list_recommendations":
                    params = {"resourceId": args["resourceId"]} if args.get("resourceId") else {}
                    response = await client.get(f"{base}/recommendations", params=params, headers=headers)
                elif tool_name == "preview_action":
                    response = await client.post(f"{base}/actions/preview", json=args, headers=headers)
                else:
                    return "Unknown tool."

                response.raise_for_status()
                return response.text
        except Exception as exc:
            return f"Tool unavailable: {type(exc).__name__}"


AI_TOOL_REGISTRY = AiToolRegistry()
