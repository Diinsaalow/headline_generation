from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo import DESCENDING

from db.mongodb import get_collection


def get_history_collection():
    return get_collection("history")


def serialize_history(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "article": document["article"],
        "headline": document["headline"],
        "category": document.get("category", "unknown"),
        "model_used": document.get("model_used", ""),
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
) -> dict:
    history_document = {
        "user_id": require_object_id(user_id, "User account was not found."),
        "article": require_text(article, "Article text"),
        "headline": require_text(headline, "Generated headline"),
        "category": require_text(category, "Category").lower(),
        "model_used": require_text(model_used, "Model used"),
        "created_at": datetime.now(timezone.utc),
    }

    result = get_history_collection().insert_one(history_document)
    history_document["_id"] = result.inserted_id
    return serialize_history(history_document)


def list_history_for_user(user_id: str) -> list[dict]:
    user_object_id = require_object_id(user_id, "User account was not found.")
    cursor = (
        get_history_collection()
        .find({"user_id": user_object_id})
        .sort("created_at", DESCENDING)
    )
    return [serialize_history(item) for item in cursor]


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
