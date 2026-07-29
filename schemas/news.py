from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PublicNewsSummary(BaseModel):
    id: str
    headline: str
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicNewsDetail(BaseModel):
    id: str
    headline: str
    article: str
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicNewsListResponse(BaseModel):
    items: list[PublicNewsSummary]
    total: int
    page: int
    page_size: int
    total_pages: int
