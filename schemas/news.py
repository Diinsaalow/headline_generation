from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PublicNewsSummary(BaseModel):
    id: str
    headline: str
    category: str
    created_at: datetime
    article_preview: str
    published_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PublicNewsDetail(PublicNewsSummary):
    article: str
    model_used: str
    generation_time_seconds: float | None = None

    model_config = ConfigDict(from_attributes=True)


class PublicNewsListResponse(BaseModel):
    items: list[PublicNewsSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class NewsCategoriesResponse(BaseModel):
    categories: list[str]


class PublishNewsRequest(BaseModel):
    article: str = Field(min_length=1)
    headline: str = Field(min_length=1)
    category: str = Field(min_length=1)
    model_used: str = Field(min_length=1)
    generation_time_seconds: float = Field(default=0, ge=0)


class PublishNewsResponse(BaseModel):
    id: str
    headline: str
    category: str
    article: str
    model_used: str
    generation_time_seconds: float
    published_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
