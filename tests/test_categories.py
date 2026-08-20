from services.categories import (
    get_category_query_values,
    get_system_news_categories,
    normalize_category,
)
from services.inference import parse_generated_output


def test_system_news_categories_are_the_four_valid_values():
    assert get_system_news_categories() == ["amni", "ciyaaro", "siyaasad", "caalamka"]


def test_normalize_category_maps_aliases_to_valid_values():
    assert normalize_category("politics") == "siyaasad"
    assert normalize_category("sports") == "ciyaaro"
    assert normalize_category("security") == "amni"
    assert normalize_category("world") == "caalamka"
    assert normalize_category("unknown") == "caalamka"
    assert normalize_category("Siyaasad") == "siyaasad"
    assert normalize_category("not-a-real-category") == "caalamka"
    assert normalize_category("") == "caalamka"


def test_category_query_values_include_aliases_for_known_categories():
    values = get_category_query_values("siyaasad")
    assert values is not None
    assert "siyaasad" in values
    assert "politics" in values


def test_unknown_category_filter_does_not_collapse_to_default():
    assert get_category_query_values("nonexistent") == ["nonexistent"]


def test_parse_generated_output_normalizes_model_category():
    _, category = parse_generated_output("headline: War cusub || category: politics")
    assert category == "siyaasad"


def test_parse_generated_output_defaults_missing_category():
    _, category = parse_generated_output("headline: War cusub")
    assert category == "caalamka"
