from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from db.mongodb import get_collection
from services.security import hash_password, verify_password


def get_users_collection():
    return get_collection("users")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def serialize_user(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "email": document["email"],
        "created_at": document["created_at"],
    }


def get_user_by_id(user_id: str) -> dict | None:
    if not ObjectId.is_valid(user_id):
        return None

    document = get_users_collection().find_one({"_id": ObjectId(user_id)})
    if document is None:
        return None

    return serialize_user(document)


def create_user(email: str, password: str) -> dict:
    user_document = {
        "email": normalize_email(email),
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = get_users_collection().insert_one(user_document)
    except DuplicateKeyError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        ) from error

    user_document["_id"] = result.inserted_id
    return serialize_user(user_document)


def authenticate_user(email: str, password: str) -> dict:
    user_document = get_users_collection().find_one({"email": normalize_email(email)})
    if user_document is None or not verify_password(
        password, user_document["password_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return serialize_user(user_document)
