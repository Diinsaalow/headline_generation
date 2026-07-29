from typing import Annotated

from fastapi import APIRouter, Query

from schemas.news import PublicNewsDetail, PublicNewsListResponse
from services.history_service import MAX_PAGE_SIZE
from services.news_service import get_public_news_item, list_public_news

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


@router.get("/{news_id}", response_model=PublicNewsDetail)
def get_news(news_id: str):
    return get_public_news_item(news_id)
