import re

MAX_INPUT_TOKENS = 512
PROMPT_PREFIX = "generate Somali headline and category: "
PROMPT_TOKEN_RESERVE = 20
CHARS_PER_TOKEN_ESTIMATE = 3
MIN_ARTICLE_WORDS = 5

ARABIC_SCRIPT_PATTERN = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")
NON_LATIN_SCRIPT_PATTERN = re.compile(
    r"[\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u0900-\u097F"
    r"\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]"
)
MATH_PATTERN = re.compile(
    r"(\d+\s*[+\-*/^=]\s*\d+)|(\$\$)|(\\frac\b)|(\bintegral\b)|(\bsqrt\b)",
    re.IGNORECASE,
)
WORD_PATTERN = re.compile(r"[A-Za-z\u00C0-\u024F']+", re.UNICODE)

ENGLISH_STOP_WORDS = {
    "the", "and", "is", "are", "was", "were", "have", "has", "had", "this", "that",
    "with", "from", "they", "their", "been", "will", "would", "could", "should",
    "about", "which", "when", "where", "what", "who", "how", "why", "not", "but",
    "for", "you", "your", "our", "we", "he", "she", "it", "them", "than", "then",
    "into", "over", "after", "before", "because", "said", "according", "government",
    "people", "year", "years", "new", "news", "report", "reports", "officials",
}

SOMALI_MARKERS = {
    "waxaa", "waxay", "waxa", "ayaa", "ayuu", "ayay", "waa", "ma", "ka", "ku", "la",
    "uu", "ee", "oo", "si", "lo", "leh", "yahay", "ahaa", "karo", "karaa", "ay",
    "iyadoo", "kadib", "markii", "haddii", "sida", "dadka", "dalka", "magaalada",
    "wasiir", "madaxweyne", "gobol", "qaranka", "soomaali", "soomaaliya", "dowladda",
    "dowladda", "wasaradda", "baarlamaanka", "booliska", "ciidanka", "degmada",
}

SWAHILI_MARKERS = {
    "na", "kwa", "ya", "wa", "ni", "katika", "ambao", "hii", "hilo", "yake", "zake",
    "pia", "lakini", "kutoka", "baina", "watu", "serikali", "nchi", "mjini", "habari",
}


def get_article_character_limit() -> int:
    usable_tokens = MAX_INPUT_TOKENS - PROMPT_TOKEN_RESERVE
    return max(300, usable_tokens * CHARS_PER_TOKEN_ESTIMATE)


def get_model_limits() -> dict:
    return {
        "max_input_tokens": MAX_INPUT_TOKENS,
        "max_article_characters": get_article_character_limit(),
        "min_article_words": MIN_ARTICLE_WORDS,
    }


def _word_list(text: str) -> list[str]:
    return [word.lower() for word in WORD_PATTERN.findall(text)]


def validate_somali_article(
    text: str,
    *,
    max_characters: int | None = None,
) -> dict:
    cleaned = re.sub(r"\s+", " ", text.strip())
    character_limit = max_characters or get_article_character_limit()

    if not cleaned:
        return {"valid": False, "message": "Article text is required."}

    if len(cleaned) > character_limit:
        return {
            "valid": False,
            "message": (
                f"Article is too long. Maximum {character_limit:,} characters "
                f"are allowed for the selected model."
            ),
        }

    if ARABIC_SCRIPT_PATTERN.search(cleaned):
        return {
            "valid": False,
            "message": "Arabic script is not allowed. Please paste a Somali article written in Latin letters.",
        }

    if NON_LATIN_SCRIPT_PATTERN.search(cleaned):
        return {
            "valid": False,
            "message": "Only Somali text in Latin letters is accepted. Remove other scripts such as Cyrillic or Chinese characters.",
        }

    if MATH_PATTERN.search(cleaned):
        return {
            "valid": False,
            "message": "Mathematical formulas and equations are not accepted. Please paste a Somali news article.",
        }

    words = _word_list(cleaned)
    if len(words) < MIN_ARTICLE_WORDS:
        return {
            "valid": False,
            "message": (
                f"Please provide a Somali news article with at least "
                f"{MIN_ARTICLE_WORDS} words."
            ),
        }

    digit_count = sum(character.isdigit() for character in cleaned)
    symbol_count = sum(not character.isalnum() and not character.isspace() for character in cleaned)
    if len(cleaned) > 0 and (digit_count + symbol_count) / len(cleaned) > 0.2:
        return {
            "valid": False,
            "message": "The input looks like numbers or symbols rather than a Somali news article.",
        }

    meaningful_words = [word for word in words if len(word) > 2]
    if not meaningful_words:
        return {
            "valid": False,
            "message": "Please provide a readable Somali news article.",
        }

    english_hits = sum(1 for word in meaningful_words if word in ENGLISH_STOP_WORDS)
    somali_hits = sum(1 for word in meaningful_words if word in SOMALI_MARKERS)
    swahili_hits = sum(1 for word in meaningful_words if word in SWAHILI_MARKERS)
    english_ratio = english_hits / len(meaningful_words)
    swahili_ratio = swahili_hits / len(meaningful_words)

    if english_ratio >= 0.2 and somali_hits < 2:
        return {
            "valid": False,
            "message": "The text appears to be English. This tool only accepts Somali news articles.",
        }

    if swahili_hits >= 3 and swahili_hits > somali_hits:
        return {
            "valid": False,
            "message": "The text appears to be Swahili. This tool only accepts Somali news articles.",
        }

    if swahili_ratio >= 0.12 and somali_hits == 0:
        return {
            "valid": False,
            "message": "The text does not look like Somali. Please paste a Somali news article.",
        }

    if somali_hits == 0 and english_ratio >= 0.08:
        return {
            "valid": False,
            "message": "Could not detect Somali language patterns. Please paste a Somali news article.",
        }

    if somali_hits == 0 and len(meaningful_words) < 12:
        return {
            "valid": False,
            "message": "The article is too short to verify Somali language. Please paste a longer Somali news article.",
        }

    return {"valid": True, "message": None}
