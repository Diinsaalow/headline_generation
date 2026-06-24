from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user
from schemas.history import (
    DeleteHistoryResponse,
    HistoryCreateRequest,
    HistoryItem,
    HistoryListResponse,
)
from services.history_service import (
    create_history_entry,
    delete_history_item_for_user,
    get_history_item_for_user,
    list_history_for_user,
)

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryListResponse)
def list_history(current_user: dict = Depends(get_current_user)):
    return {"items": list_history_for_user(current_user["id"])}


@router.post("", response_model=HistoryItem, status_code=201)
def create_history(payload: HistoryCreateRequest, current_user: dict = Depends(get_current_user)):
    return create_history_entry(
        user_id=current_user["id"],
        article=payload.article,
        headline=payload.headline,
        category=payload.category,
        model_used=payload.model_used,
    )


@router.get("/{history_id}", response_model=HistoryItem)
def get_history(history_id: str, current_user: dict = Depends(get_current_user)):
    return get_history_item_for_user(current_user["id"], history_id)


@router.delete("/{history_id}", response_model=DeleteHistoryResponse)
def delete_history(history_id: str, current_user: dict = Depends(get_current_user)):
    delete_history_item_for_user(current_user["id"], history_id)
    return {"message": "History item deleted."}
