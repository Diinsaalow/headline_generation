from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


HistoryStatus = Literal["success", "failed"]
HistorySortField = Literal["created_at", "headline", "category", "model_used", "status"]
SortOrder = Literal["asc", "desc"]


class HistoryCreateRequest(BaseModel):
    article: str = Field(min_length=1)
    headline: str = Field(min_length=1)
    category: str = Field(min_length=1)
    model_used: str = Field(min_length=1)
    status: HistoryStatus = "success"
    error_message: str | None = None
    generation_time_seconds: float | None = Field(default=None, ge=0)


class PublishExistingHistoryRequest(BaseModel):
    headline: str = Field(min_length=1)


class HistoryItem(BaseModel):
    id: str
    article: str
    headline: str
    category: str
    model_used: str
    status: HistoryStatus = "success"
    error_message: str | None = None
    created_at: datetime
    published_at: datetime | None = None
    generation_time_seconds: float | None = None

    model_config = ConfigDict(from_attributes=True)


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class HistoryFiltersResponse(BaseModel):
    categories: list[str]
    models: list[str]
    statuses: list[HistoryStatus]


class DeleteHistoryResponse(BaseModel):
    message: str
