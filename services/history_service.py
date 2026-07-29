import math
import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING

from db.mongodb import get_collection

VALID_STATUSES = {"success", "failed"}
VALID_SORT_FIELDS = {"created_at", "headline", "category", "model_used", "status"}
DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 50


def get_history_collection():
    return get_collection("history")


def serialize_history(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "article": document["article"],
        "headline": document.get("headline", ""),
        "category": document.get("category", "unknown"),
        "model_used": document.get("model_used", ""),
        "status": document.get("status", "success"),
        "error_message": document.get("error_message"),
        "created_at": document["created_at"],
    }


def require_object_id(value: str, detail: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

    return ObjectId(value)


def require_text(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} is required.",
        )

    return cleaned


def create_history_entry(
    user_id: str,
    article: str,
    headline: str,
    category: str,
    model_used: str,
    *,
    entry_status: str = "success",
    error_message: str | None = None,
) -> dict:
    if entry_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid history status.",
        )

    cleaned_article = require_text(article, "Article text")
    cleaned_model = require_text(model_used, "Model used")

    if entry_status == "success":
        cleaned_headline = require_text(headline, "Generated headline")
        cleaned_category = require_text(category, "Category").lower()
    else:
        cleaned_headline = headline.strip()
        cleaned_category = category.strip().lower() or "unknown"

    history_document = {
        "user_id": require_object_id(user_id, "User account was not found."),
        "article": cleaned_article,
        "headline": cleaned_headline,
        "category": cleaned_category,
        "model_used": cleaned_model,
        "status": entry_status,
        "created_at": datetime.now(timezone.utc),
    }

    if error_message:
        history_document["error_message"] = error_message.strip()

    result = get_history_collection().insert_one(history_document)
    history_document["_id"] = result.inserted_id
    return serialize_history(history_document)


def _build_history_query(
    user_object_id: ObjectId,
    *,
    search: str | None = None,
    category: str | None = None,
    model_used: str | None = None,
    entry_status: str | None = None,
) -> dict:
    query: dict = {"user_id": user_object_id}

    if search:
        escaped = re.escape(search.strip())
        if escaped:
            query["$or"] = [
                {"article": {"$regex": escaped, "$options": "i"}},
                {"headline": {"$regex": escaped, "$options": "i"}},
            ]

    if category:
        query["category"] = category.strip().lower()

    if model_used:
        query["model_used"] = model_used.strip()

    if entry_status:
        if entry_status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid status filter. Use 'success' or 'failed'.",
            )
        query["status"] = entry_status

    return query


def list_history_for_user(
    user_id: str,
    *,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
    search: str | None = None,
    category: str | None = None,
    model_used: str | None = None,
    entry_status: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict:
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Page must be at least 1.",
        )

    if page_size < 1 or page_size > MAX_PAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Page size must be between 1 and {MAX_PAGE_SIZE}.",
        )

    if sort_by not in VALID_SORT_FIELDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Invalid sort field. Use one of: "
                + ", ".join(sorted(VALID_SORT_FIELDS))
                + "."
            ),
        )

    if sort_order not in {"asc", "desc"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid sort order. Use 'asc' or 'desc'.",
        )

    user_object_id = require_object_id(user_id, "User account was not found.")
    query = _build_history_query(
        user_object_id,
        search=search,
        category=category,
        model_used=model_used,
        entry_status=entry_status,
    )

    collection = get_history_collection()
    total = collection.count_documents(query)
    total_pages = max(1, math.ceil(total / page_size)) if total else 0

    if total > 0 and page > total_pages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Page {page} is out of range. Total pages: {total_pages}.",
        )

    sort_direction = ASCENDING if sort_order == "asc" else DESCENDING
    skip = (page - 1) * page_size

    cursor = (
        collection.find(query)
        .sort(sort_by, sort_direction)
        .skip(skip)
        .limit(page_size)
    )

    return {
        "items": [serialize_history(item) for item in cursor],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_history_filter_options(user_id: str) -> dict:
    user_object_id = require_object_id(user_id, "User account was not found.")
    collection = get_history_collection()
    base_query = {"user_id": user_object_id}

    categories = sorted(
        value
        for value in collection.distinct("category", base_query)
        if isinstance(value, str) and value.strip()
    )
    models = sorted(
        value
        for value in collection.distinct("model_used", base_query)
        if isinstance(value, str) and value.strip()
    )

    return {
        "categories": categories,
        "models": models,
        "statuses": ["success", "failed"],
    }


def get_history_item_for_user(user_id: str, history_id: str) -> dict:
    user_object_id = require_object_id(user_id, "User account was not found.")
    history_object_id = require_object_id(history_id, "History item not found.")

    history_document = get_history_collection().find_one(
        {"_id": history_object_id, "user_id": user_object_id}
    )
    if history_document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found.",
        )

    return serialize_history(history_document)


def delete_history_item_for_user(user_id: str, history_id: str) -> None:
    user_object_id = require_object_id(user_id, "User account was not found.")
    history_object_id = require_object_id(history_id, "History item not found.")

    result = get_history_collection().delete_one(
        {"_id": history_object_id, "user_id": user_object_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History item not found.",
        )
