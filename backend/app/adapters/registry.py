"""Adapter Registry for Cloud Provider Adapters.

Registers "adapters" port and retrieves appropriate CloudProviderAdapter.
Conforms to ARCHITECTURE.md §10.1 and §16.3.
"""

from typing import Any
import os

from app.ports import CloudProviderAdapter, provide
from app.adapters.mock_adapter import MockAdapter


class AdapterRegistry:
    """Registry that provides the matching CloudProviderAdapter instance for an account."""

    def get(self, account: Any) -> CloudProviderAdapter:
        mode = getattr(account, "mode", None)
        global_mode = os.getenv("PROVIDER_MODE", "mock").lower()

        provider = getattr(account, "provider", "AWS")

        if mode == "MOCK" or global_mode == "mock":
            return MockAdapter(provider=provider)

        # Fallback to mock adapter
        return MockAdapter(provider=provider)


# Register port automatically on import
provide("adapters", AdapterRegistry())
