from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HistoryCreateRequest(BaseModel):
    article: str = Field(min_length=1)
    headline: str = Field(min_length=1)
    category: str = Field(min_length=1)
    model_used: str = Field(min_length=1)


class HistoryItem(BaseModel):
    id: str
    article: str
    headline: str
    category: str
    model_used: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]


class DeleteHistoryResponse(BaseModel):
    message: str
