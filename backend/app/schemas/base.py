"""Base Pydantic models and envelope wrappers for FastAPI responses.

Conforms to ARCHITECTURE.md §4.1 and §4.3.
"""

from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PageMeta(CamelModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class ApiResponse(CamelModel, Generic[T]):
    success: bool = True
    data: T


class PagedResponse(CamelModel, Generic[T]):
    success: bool = True
    data: list[T]
    meta: PageMeta
