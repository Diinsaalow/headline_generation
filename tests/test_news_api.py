from tests.conftest import seed_history


def test_list_public_news_is_public(client, auth_headers, test_user):
    seed_history(test_user["id"], count=3)

    response = client.get("/news")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 2
    assert len(payload["items"]) == 2
    assert "article" not in payload["items"][0]
    assert "article_preview" in payload["items"][0]
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


def test_public_news_excludes_unpublished_drafts(client, auth_headers, test_user):
    from services.history_service import create_history_entry

    create_history_entry(
        user_id=test_user["id"],
        article="Draft article that should not appear publicly.",
        headline="Draft headline",
        category="politics",
        model_used="model-a",
        entry_status="success",
        published_at=None,
    )
    seed_history(test_user["id"], count=1)

    response = client.get("/news")
    payload = response.json()

    assert payload["total"] == 1
    assert payload["items"][0]["headline"] == "Generated headline 0"
    assert all(item["headline"] != "Draft headline" for item in payload["items"])


def test_get_public_news_detail(client, auth_headers, test_user):
    items = seed_history(test_user["id"], count=1)
    success_item = next(item for item in items if item["status"] == "success")

    response = client.get(f"/news/{success_item['id']}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["headline"] == success_item["headline"]
    assert payload["article"] == success_item["article"]
    assert "model_used" not in payload
    assert "generation_time_seconds" not in payload
    assert "error_message" not in payload


def test_public_news_detail_omits_internal_fields(client, auth_headers, test_user):
    publish_response = client.post(
        "/news/publish",
        headers=auth_headers,
        json={
            "article": "A Somali news article with sufficient body content.",
            "headline": "Detail headline",
            "category": "politics",
            "model_used": "model-a",
            "generation_time_seconds": 3.14,
        },
    )
    assert publish_response.status_code == 201
    news_id = publish_response.json()["id"]

    detail_response = client.get(f"/news/{news_id}")

    assert detail_response.status_code == 200
    payload = detail_response.json()
    assert "model_used" not in payload
    assert "generation_time_seconds" not in payload


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


def test_publish_news_creates_visible_article(client, auth_headers, test_user):
    response = client.post(
        "/news/publish",
        headers=auth_headers,
        json={
            "article": "A newly published Somali news article with enough content.",
            "headline": "Published headline",
            "category": "politics",
            "model_used": "model-a",
            "generation_time_seconds": 2.43,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["headline"] == "Published headline"
    assert payload["published_at"] is not None
    assert payload["generation_time_seconds"] == 2.43

    list_response = client.get("/news")
    list_payload = list_response.json()
    assert list_payload["total"] >= 1
    assert any(item["headline"] == "Published headline" for item in list_payload["items"])


def test_publish_news_requires_authentication(client):
    response = client.post(
        "/news/publish",
        json={
            "article": "Article text",
            "headline": "Headline",
            "category": "politics",
            "model_used": "model-a",
            "generation_time_seconds": 1.0,
        },
    )

    assert response.status_code == 401


def test_get_news_categories(client, auth_headers, test_user):
    seed_history(test_user["id"], count=3)

    response = client.get("/news/categories")

    assert response.status_code == 200
    payload = response.json()
    assert payload["categories"] == ["amni", "ciyaaro", "siyaasad", "caalamka"]


def test_list_public_news_category_filter(client, auth_headers, test_user):
    seed_history(test_user["id"], count=3)

    response = client.get("/news?category=politics")
    payload = response.json()

    assert response.status_code == 200
    assert payload["total"] >= 1
    assert all(item["category"] == "politics" for item in payload["items"])

    empty_response = client.get("/news?category=nonexistent")
    empty_payload = empty_response.json()
    assert empty_payload["total"] == 0
