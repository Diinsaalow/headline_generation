from tests.conftest import seed_history


def test_create_history_entry_success(mock_db, test_user):
    item = seed_history(test_user["id"], count=1)[0]

    assert item["headline"] == "Generated headline 0"
    assert item["category"] == "siyaasad"
    assert item["model_used"] == "model-a"
    assert item["status"] == "success"
    assert item["error_message"] is None


def test_create_failed_history_entry(mock_db, test_user):
    from services.history_service import create_history_entry

    item = create_history_entry(
        user_id=test_user["id"],
        article="Failed article text",
        headline="",
        category="unknown",
        model_used="model-a",
        entry_status="failed",
        error_message="Model unavailable.",
    )

    assert item["status"] == "failed"
    assert item["headline"] == ""
    assert item["error_message"] == "Model unavailable."


def test_list_history_pagination(mock_db, test_user):
    seed_history(test_user["id"], count=12)

    from services.history_service import list_history_for_user

    page_one = list_history_for_user(test_user["id"], page=1, page_size=5)
    page_three = list_history_for_user(test_user["id"], page=3, page_size=5)

    assert page_one["total"] == 12
    assert page_one["page"] == 1
    assert page_one["page_size"] == 5
    assert page_one["total_pages"] == 3
    assert len(page_one["items"]) == 5
    assert len(page_three["items"]) == 2


def test_list_history_search_and_filters(mock_db, test_user):
    seed_history(test_user["id"], count=4)

    from services.history_service import list_history_for_user

    search_result = list_history_for_user(
        test_user["id"],
        search="headline 2",
    )
    assert search_result["total"] == 1
    assert search_result["items"][0]["headline"] == "Generated headline 2"

    category_result = list_history_for_user(
        test_user["id"],
        category="siyaasad",
    )
    assert category_result["total"] >= 1
    assert all(item["category"] == "siyaasad" for item in category_result["items"])

    alias_result = list_history_for_user(
        test_user["id"],
        category="politics",
    )
    assert alias_result["total"] >= 1
    assert all(item["category"] == "siyaasad" for item in alias_result["items"])

    status_result = list_history_for_user(
        test_user["id"],
        entry_status="failed",
    )
    assert status_result["total"] >= 1
    assert all(item["status"] == "failed" for item in status_result["items"])


def test_list_history_user_scoping(mock_db, test_user, other_user):
    seed_history(test_user["id"], count=2)
    seed_history(other_user["id"], count=3)

    from services.history_service import list_history_for_user

    user_history = list_history_for_user(test_user["id"])
    other_history = list_history_for_user(other_user["id"])

    assert user_history["total"] == 2
    assert other_history["total"] == 3
