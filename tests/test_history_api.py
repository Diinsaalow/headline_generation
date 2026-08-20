from datetime import datetime, timezone

from tests.conftest import seed_history


def _parse_iso_ms(value: str) -> datetime:
    """Parse an ISO timestamp, comparing only down to millisecond precision.

    BSON stores datetimes at millisecond resolution, so the value returned when
    a document is re-read can differ in sub-millisecond digits from the freshly
    computed in-memory value returned on first publish.
    """
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed.replace(microsecond=(parsed.microsecond // 1000) * 1000)


def test_history_requires_authentication(client):
    response = client.get("/history")
    assert response.status_code == 401


def test_list_history_returns_paginated_payload(client, auth_headers, test_user):
    seed_history(test_user["id"], count=7)

    response = client.get("/history?page=1&page_size=5", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 7
    assert payload["page"] == 1
    assert payload["page_size"] == 5
    assert payload["total_pages"] == 2
    assert len(payload["items"]) == 5
    assert payload["items"][0]["status"] in {"success", "failed"}


def test_history_filters_endpoint(client, auth_headers, test_user):
    seed_history(test_user["id"], count=4)

    response = client.get("/history/filters", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["categories"] == ["amni", "ciyaaro", "siyaasad", "caalamka"]
    assert "model-a" in payload["models"]
    assert payload["statuses"] == ["success", "failed"]


def test_history_search_query(client, auth_headers, test_user):
    seed_history(test_user["id"], count=3)

    response = client.get(
        "/history?search=Article%20content%20number%201",
        headers=auth_headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert "number 1" in payload["items"][0]["article"]


def test_get_history_item(client, auth_headers, test_user):
    item = seed_history(test_user["id"], count=1)[0]

    response = client.get(f"/history/{item['id']}", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == item["id"]
    assert payload["headline"] == item["headline"]


def test_delete_history_item(client, auth_headers, test_user):
    item = seed_history(test_user["id"], count=1)[0]

    delete_response = client.delete(f"/history/{item['id']}", headers=auth_headers)
    assert delete_response.status_code == 200

    get_response = client.get(f"/history/{item['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_publish_history_to_news(client, auth_headers, test_user):
    response = client.post(
        "/history/publish",
        headers=auth_headers,
        json={
            "article": "A newly published Somali news article with enough content.",
            "headline": "Published headline",
            "category": "politics",
            "model_used": "model-a",
            "generation_time_seconds": 1.25,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["headline"] == "Published headline"
    assert payload["category"] == "siyaasad"
    assert payload["published_at"] is not None

    news_response = client.get("/news")
    assert news_response.status_code == 200
    assert any(item["headline"] == "Published headline" for item in news_response.json()["items"])


def test_create_history_draft_is_saved_but_not_public(client, auth_headers, test_user):
    response = client.post(
        "/history",
        headers=auth_headers,
        json={
            "article": "A saved-only Somali draft article with enough content.",
            "headline": "Saved draft headline",
            "category": "politics",
            "model_used": "model-a",
            "generation_time_seconds": 4.5,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["published_at"] is None
    assert payload["generation_time_seconds"] == 4.5

    history_response = client.get("/history", headers=auth_headers)
    assert history_response.status_code == 200
    history_payload = history_response.json()
    assert history_payload["total"] == 1
    assert any(
        item["id"] == payload["id"] and item["headline"] == "Saved draft headline"
        for item in history_payload["items"]
    )

    news_response = client.get("/news")
    assert news_response.status_code == 200
    news_payload = news_response.json()
    assert news_payload["total"] == 0
    assert all(item["id"] != payload["id"] for item in news_payload["items"])


def test_save_then_publish_promotes_same_history_row(client, auth_headers, test_user):
    save_response = client.post(
        "/history",
        headers=auth_headers,
        json={
            "article": "A draft that will later be promoted to public news.",
            "headline": "Draft before publish",
            "category": "politics",
            "model_used": "model-a",
            "generation_time_seconds": 2.0,
        },
    )
    assert save_response.status_code == 201
    saved_id = save_response.json()["id"]
    assert save_response.json()["published_at"] is None

    publish_response = client.post(
        f"/history/{saved_id}/publish",
        headers=auth_headers,
        json={"headline": "Published after edit"},
    )
    assert publish_response.status_code == 200
    publish_payload = publish_response.json()
    assert publish_payload["id"] == saved_id
    assert publish_payload["headline"] == "Published after edit"
    assert publish_payload["published_at"] is not None

    news_response = client.get("/news")
    news_payload = news_response.json()
    assert any(item["id"] == saved_id for item in news_payload["items"])

    history_response = client.get("/history", headers=auth_headers)
    history_payload = history_response.json()
    assert history_payload["total"] == 1
    assert history_payload["items"][0]["id"] == saved_id
    assert history_payload["items"][0]["headline"] == "Published after edit"


def test_publish_existing_history_is_idempotent(client, auth_headers, test_user):
    save_response = client.post(
        "/history",
        headers=auth_headers,
        json={
            "article": "An idempotent publish draft with sufficient content.",
            "headline": "Idempotent draft",
            "category": "politics",
            "model_used": "model-a",
        },
    )
    saved_id = save_response.json()["id"]

    first_publish = client.post(
        f"/history/{saved_id}/publish",
        headers=auth_headers,
        json={"headline": "Idempotent published"},
    )
    assert first_publish.status_code == 200
    first_published_at = first_publish.json()["published_at"]
    assert first_publish.json()["id"] == saved_id

    second_publish = client.post(
        f"/history/{saved_id}/publish",
        headers=auth_headers,
        json={"headline": "This edit should be ignored"},
    )
    assert second_publish.status_code == 200
    second_payload = second_publish.json()
    assert second_payload["id"] == saved_id
    # Idempotent: the already-published row keeps its original headline and
    # publish time (a second publish must not overwrite either).
    assert second_payload["headline"] == "Idempotent published"
    assert _parse_iso_ms(second_payload["published_at"]) == _parse_iso_ms(
        first_published_at
    )

    history_response = client.get("/history", headers=auth_headers)
    assert history_response.json()["total"] == 1


def test_publish_existing_history_not_owned_returns_404(
    client, auth_headers, test_user, other_user
):
    from services.history_service import create_history_entry

    other_item = create_history_entry(
        user_id=other_user["id"],
        article="Another user's draft article content.",
        headline="Other user draft",
        category="politics",
        model_used="model-a",
        entry_status="success",
        published_at=None,
    )

    response = client.post(
        f"/history/{other_item['id']}/publish",
        headers=auth_headers,
        json={"headline": "Trying to publish someone else's draft"},
    )

    assert response.status_code == 404
