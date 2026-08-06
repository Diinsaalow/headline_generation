from typing import Annotated

from fastapi import APIRouter, Depends, Query

from dependencies.auth import get_current_user
from schemas.news import (
    NewsCategoriesResponse,
    PublicNewsDetail,
    PublicNewsListResponse,
    PublishNewsRequest,
    PublishNewsResponse,
)
from services.history_service import MAX_PAGE_SIZE, publish_news_entry
from services.news_service import (
    get_public_news_categories,
    get_public_news_item,
    list_public_news,
)

router = APIRouter(prefix="/news", tags=["news"])


@router.get("", response_model=PublicNewsListResponse)
def list_news(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = 12,
    search: Annotated[str | None, Query(max_length=200)] = None,
    category: Annotated[str | None, Query(max_length=100)] = None,
):
    return list_public_news(
        page=page,
        page_size=page_size,
        search=search,
        category=category,
    )


@router.get("/categories", response_model=NewsCategoriesResponse)
def list_news_categories():
    return {"categories": get_public_news_categories()}


@router.post("/publish", response_model=PublishNewsResponse, status_code=201)
def publish_news(
    payload: PublishNewsRequest,
    current_user: dict = Depends(get_current_user),
):
    item = publish_news_entry(
        user_id=current_user["id"],
        article=payload.article,
        headline=payload.headline,
        category=payload.category,
        model_used=payload.model_used,
        generation_time_seconds=payload.generation_time_seconds,
    )
    return {
        "id": item["id"],
        "headline": item["headline"],
        "category": item["category"],
        "article": item["article"],
        "model_used": item["model_used"],
        "generation_time_seconds": item["generation_time_seconds"],
        "published_at": item["published_at"],
        "created_at": item["created_at"],
    }


@router.get("/{news_id}", response_model=PublicNewsDetail)
def get_news(news_id: str):
    return get_public_news_item(news_id)
