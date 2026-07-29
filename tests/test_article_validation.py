from services.article_validation import validate_somali_article

SOMALI_SAMPLE = (
    "Waxaa magaalada Muqdisho ka dhacay shir ay isugu yimaadeen masuuliyiin ka tirsan "
    "dowladda federaalka Soomaaliya si ay uga wada hadlaan amniga iyo horumarka dalka."
)

ENGLISH_SAMPLE = (
    "The government said yesterday that officials will meet in the capital to discuss "
    "security and development plans for the country this year."
)

ARABIC_SAMPLE = "قالت الحكومة أن الاجتماع سيعقد غدا في العاصمة لمناقشة الأمن."

SWAHILI_SAMPLE = (
    "Serikali ilitangaza kuwa watu wengi watahudhuria mkutano mjini kwa ajili ya "
    "kujadili amani na maendeleo katika nchi hii."
)

MATH_SAMPLE = "Solve for x: 2x + 5 = 15 and integrate the function over the domain."


def test_validate_somali_article_accepts_somali_text():
    result = validate_somali_article(SOMALI_SAMPLE)
    assert result["valid"] is True


def test_validate_somali_article_rejects_english():
    result = validate_somali_article(ENGLISH_SAMPLE)
    assert result["valid"] is False
    assert "English" in result["message"]


def test_validate_somali_article_rejects_arabic_script():
    result = validate_somali_article(ARABIC_SAMPLE)
    assert result["valid"] is False
    assert "Arabic" in result["message"]


def test_validate_somali_article_rejects_swahili():
    result = validate_somali_article(SWAHILI_SAMPLE)
    assert result["valid"] is False


def test_validate_somali_article_rejects_math():
    result = validate_somali_article(MATH_SAMPLE)
    assert result["valid"] is False


def test_validate_somali_article_enforces_character_limit():
    result = validate_somali_article("waa " * 400, max_characters=100)
    assert result["valid"] is False
    assert "too long" in result["message"]
