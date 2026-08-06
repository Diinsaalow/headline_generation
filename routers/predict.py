import time

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_user
from schemas.predict import ArticleRequest, ModelsResponse, PredictionResponse
from services.article_validation import get_article_character_limit, validate_somali_article
from services.history_service import create_history_entry
from services.article_validation import get_model_limits
from services.inference import get_available_models, get_default_model_id, run_inference

router = APIRouter(tags=["prediction"])


@router.get("/models", response_model=ModelsResponse)
def list_models():
    limits = get_model_limits()
    models = [
        {**model, **limits}
        for model in get_available_models()
    ]
    return {
        "models": models,
        "default_model": get_default_model_id(),
        **limits,
    }


@router.post("/predict", response_model=PredictionResponse)
def predict(request: ArticleRequest, current_user: dict = Depends(get_current_user)):
    article = request.article.strip()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Article text is required.",
        )

    validation = validate_somali_article(
        article,
        max_characters=get_article_character_limit(),
    )
    if not validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=validation["message"],
        )

    model_id = request.model_id or get_default_model_id() or ""

    try:
        start_time = time.perf_counter()
        prediction = run_inference(article, request.model_id)
        generation_time_seconds = round(time.perf_counter() - start_time, 2)

        return {
            **prediction,
            "status": "success",
            "error_message": None,
            "generation_time_seconds": generation_time_seconds,
        }
    except HTTPException as error:
        if model_id:
            create_history_entry(
                user_id=current_user["id"],
                article=article,
                headline="",
                category="unknown",
                model_used=model_id,
                entry_status="failed",
                error_message=str(error.detail),
            )
        raise
    except Exception as error:
        if model_id:
            create_history_entry(
                user_id=current_user["id"],
                article=article,
                headline="",
                category="unknown",
                model_used=model_id,
                entry_status="failed",
                error_message=str(error),
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Headline generation failed. Please try again.",
        ) from error
