import math
import re

from fastapi import HTTPException, status
from pymongo import DESCENDING

from services.categories import get_system_news_categories
from services.history_service import (
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    get_history_collection,
    require_object_id,
)

ARTICLE_PREVIEW_LENGTH = 160

# Include published articles OR legacy records (no published_at field)
PUBLIC_NEWS_FILTER = {
    "status": {"$ne": "failed"},
    "headline": {"$nin": [None, ""]},
    "$or": [
        {"published_at": {"$type": "date"}},
        {"published_at": {"$exists": False}},
    ],
}


def truncate_article_preview(article: str, max_length: int = ARTICLE_PREVIEW_LENGTH) -> str:
    cleaned = article.strip()
    if len(cleaned) <= max_length:
        return cleaned

    truncated = cleaned[:max_length].rstrip()
    if " " in truncated:
        truncated = truncated.rsplit(" ", 1)[0]

    return f"{truncated}..."


def serialize_public_news_summary(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "headline": document["headline"],
        "category": document.get("category", "unknown"),
        "created_at": document["created_at"],
        "article_preview": truncate_article_preview(document["article"]),
        "published_at": document.get("published_at"),
    }


def serialize_public_news_detail(document: dict) -> dict:
    return {
        **serialize_public_news_summary(document),
        "article": document["article"],
        "model_used": document.get("model_used", ""),
        "generation_time_seconds": document.get("generation_time_seconds"),
    }


def _build_public_news_query(
    *,
    search: str | None = None,
    category: str | None = None,
) -> dict:
    conditions: list[dict] = [PUBLIC_NEWS_FILTER]

    if search:
        escaped = re.escape(search.strip())
        if escaped:
            conditions.append(
                {
                    "$or": [
                        {"headline": {"$regex": escaped, "$options": "i"}},
                        {"article": {"$regex": escaped, "$options": "i"}},
                    ]
                }
            )

    if category:
        conditions.append({"category": category.strip().lower()})

    if len(conditions) == 1:
        return conditions[0]

    return {"$and": conditions}


def list_public_news(
    *,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
    search: str | None = None,
    category: str | None = None,
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

    query = _build_public_news_query(search=search, category=category)
    collection = get_history_collection()
    total = collection.count_documents(query)
    total_pages = max(1, math.ceil(total / page_size)) if total else 0

    if total > 0 and page > total_pages:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Page {page} is out of range. Total pages: {total_pages}.",
        )

    skip = (page - 1) * page_size
    cursor = (
        collection.find(query)
        .sort([("published_at", DESCENDING), ("created_at", DESCENDING)])
        .skip(skip)
        .limit(page_size)
    )

    return {
        "items": [serialize_public_news_summary(item) for item in cursor],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_public_news_categories() -> list[str]:
    return get_system_news_categories()


def get_public_news_item(news_id: str) -> dict:
    news_object_id = require_object_id(news_id, "News item not found.")
    document = get_history_collection().find_one(
        {"_id": news_object_id, **PUBLIC_NEWS_FILTER}
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News item not found.",
        )

    return serialize_public_news_detail(document)
