import mongomock
import pytest
from bson import ObjectId
from datetime import datetime, timezone
from fastapi.testclient import TestClient

import db.mongodb as mongodb_module
from app import app
from services.history_service import create_history_entry, list_history_for_user
from services.security import create_access_token


@pytest.fixture
def mock_db():
    client = mongomock.MongoClient()
    database = client["test_headline_ai"]
    mongodb_module._client = client
    mongodb_module._database = database
    mongodb_module._last_connection_error = None
    mongodb_module.initialize_indexes(database)
    yield database
    mongodb_module._client = None
    mongodb_module._database = None
    mongodb_module._last_connection_error = None


@pytest.fixture
def test_user(mock_db):
    user_id = ObjectId()
    mock_db.users.insert_one(
        {
            "_id": user_id,
            "email": "test@example.com",
            "password_hash": "hash",
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"id": str(user_id), "email": "test@example.com"}


@pytest.fixture
def other_user(mock_db):
    user_id = ObjectId()
    mock_db.users.insert_one(
        {
            "_id": user_id,
            "email": "other@example.com",
            "password_hash": "hash",
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"id": str(user_id), "email": "other@example.com"}


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user["id"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client(mock_db):
    return TestClient(app)


def seed_history(user_id: str, count: int = 3) -> list[dict]:
    items = []
    categories = ["siyaasad", "ciyaaro", "amni"]
    models = ["model-a", "model-b"]
    now = datetime.now(timezone.utc)

    for index in range(count):
        is_success = index % 2 == 0
        item = create_history_entry(
            user_id=user_id,
            article=f"Article content number {index} about Somali news.",
            headline=f"Generated headline {index}",
            category=categories[index % len(categories)],
            model_used=models[index % len(models)],
            entry_status="success" if is_success else "failed",
            error_message="Inference failed." if not is_success else None,
            published_at=now if is_success else None,
            generation_time_seconds=1.25 + index if is_success else None,
        )
        items.append(item)

    return items
