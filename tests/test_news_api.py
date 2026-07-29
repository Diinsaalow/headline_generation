from tests.conftest import seed_history


def test_list_public_news_is_public(client, auth_headers, test_user):
    seed_history(test_user["id"], count=3)

    response = client.get("/news")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert len(payload["items"]) == 2
    assert "article" not in payload["items"][0]
    assert payload["items"][0]["headline"]


def test_public_news_excludes_failed_entries(client, auth_headers, test_user):
    from services.history_service import create_history_entry

    create_history_entry(
        user_id=test_user["id"],
        article="Failed article",
        headline="",
        category="unknown",
        model_used="model-a",
        entry_status="failed",
        error_message="Model error",
    )
    seed_history(test_user["id"], count=1)

    response = client.get("/news")
    payload = response.json()

    assert payload["total"] == 1
    assert all(item["headline"] for item in payload["items"])


def test_get_public_news_detail(client, auth_headers, test_user):
    items = seed_history(test_user["id"], count=1)
    success_item = next(item for item in items if item["status"] == "success")

    response = client.get(f"/news/{success_item['id']}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["headline"] == success_item["headline"]
    assert payload["article"] == success_item["article"]
    assert "model_used" not in payload
    assert "error_message" not in payload


def test_public_news_includes_legacy_records_without_status(
    client, auth_headers, test_user, mock_db
):
    from datetime import datetime, timezone

    from bson import ObjectId

    mock_db.history.insert_one(
        {
            "_id": ObjectId(),
            "user_id": ObjectId(test_user["id"]),
            "article": "Legacy article body",
            "headline": "Legacy headline",
            "category": "politics",
            "model_used": "model-a",
            "created_at": datetime.now(timezone.utc),
        }
    )

    response = client.get("/news")
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 1
    assert any(item["headline"] == "Legacy headline" for item in payload["items"])


def test_get_public_news_not_found(client):
    response = client.get("/news/507f1f77bcf86cd799439011")
    assert response.status_code == 404
