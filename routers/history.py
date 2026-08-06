from typing import Annotated

from fastapi import APIRouter, Depends, Query

from dependencies.auth import get_current_user
from schemas.history import (
    DeleteHistoryResponse,
    HistoryCreateRequest,
    HistoryFiltersResponse,
    HistoryItem,
    HistoryListResponse,
    HistorySortField,
    HistoryStatus,
    SortOrder,
)
from schemas.news import PublishNewsRequest, PublishNewsResponse
from services.history_service import (
    create_history_entry,
    delete_history_item_for_user,
    get_history_filter_options,
    get_history_item_for_user,
    list_history_for_user,
    MAX_PAGE_SIZE,
    publish_news_entry,
)

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryListResponse)
def list_history(
    current_user: dict = Depends(get_current_user),
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = 10,
    search: Annotated[str | None, Query(max_length=200)] = None,
    category: Annotated[str | None, Query(max_length=100)] = None,
    model_used: Annotated[str | None, Query(max_length=100)] = None,
    status: Annotated[HistoryStatus | None, Query()] = None,
    sort_by: HistorySortField = "created_at",
    sort_order: SortOrder = "desc",
):
    return list_history_for_user(
        current_user["id"],
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        model_used=model_used,
        entry_status=status,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/filters", response_model=HistoryFiltersResponse)
def history_filters(current_user: dict = Depends(get_current_user)):
    return get_history_filter_options(current_user["id"])


@router.post("", response_model=HistoryItem, status_code=201)
def create_history(
    payload: HistoryCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    return create_history_entry(
        user_id=current_user["id"],
        article=payload.article,
        headline=payload.headline,
        category=payload.category,
        model_used=payload.model_used,
        entry_status=payload.status,
        error_message=payload.error_message,
    )


@router.post("/publish", response_model=PublishNewsResponse, status_code=201)
def publish_history_to_news(
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


@router.get("/{history_id}", response_model=HistoryItem)
def get_history(history_id: str, current_user: dict = Depends(get_current_user)):
    return get_history_item_for_user(current_user["id"], history_id)


@router.delete("/{history_id}", response_model=DeleteHistoryResponse)
def delete_history(history_id: str, current_user: dict = Depends(get_current_user)):
    delete_history_item_for_user(current_user["id"], history_id)
    return {"message": "History item deleted."}
