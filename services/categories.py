SYSTEM_NEWS_CATEGORIES = ("amni", "ciyaaro", "siyaasad", "caalamka")
DEFAULT_NEWS_CATEGORY = "caalamka"

CATEGORY_ALIASES = {
    "amni": "amni",
    "security": "amni",
    "safety": "amni",
    "defense": "amni",
    "defence": "amni",
    "ciyaaro": "ciyaaro",
    "sports": "ciyaaro",
    "sport": "ciyaaro",
    "siyaasad": "siyaasad",
    "politics": "siyaasad",
    "political": "siyaasad",
    "caalamka": "caalamka",
    "world": "caalamka",
    "international": "caalamka",
    "global": "caalamka",
    "unknown": "caalamka",
    "business": "caalamka",
    "other": "caalamka",
    "general": "caalamka",
}


def get_system_news_categories() -> list[str]:
    return list(SYSTEM_NEWS_CATEGORIES)


def normalize_category(category: str | None) -> str:
    if not category or not str(category).strip():
        return DEFAULT_NEWS_CATEGORY

    cleaned = str(category).strip().lower()
    if cleaned in SYSTEM_NEWS_CATEGORIES:
        return cleaned

    mapped = CATEGORY_ALIASES.get(cleaned)
    if mapped:
        return mapped

    for valid in SYSTEM_NEWS_CATEGORIES:
        if valid in cleaned:
            return valid

    return DEFAULT_NEWS_CATEGORY


def get_category_query_values(category: str | None) -> list[str] | None:
    if not category or not str(category).strip():
        return None

    cleaned = str(category).strip().lower()
    canonical = None
    if cleaned in SYSTEM_NEWS_CATEGORIES:
        canonical = cleaned
    elif cleaned in CATEGORY_ALIASES:
        canonical = CATEGORY_ALIASES[cleaned]

    if canonical is None:
        return [cleaned]

    values = {canonical}
    for alias, mapped in CATEGORY_ALIASES.items():
        if mapped == canonical:
            values.add(alias)
    return list(values)
