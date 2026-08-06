from tests.conftest import seed_history


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
    assert "politics" in payload["categories"]
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
    assert payload["published_at"] is not None

    news_response = client.get("/news")
    assert news_response.status_code == 200
    assert any(item["headline"] == "Published headline" for item in news_response.json()["items"])
