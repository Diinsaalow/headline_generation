from fastapi import APIRouter, Depends, HTTPException, status

from dependencies.auth import get_current_user
from schemas.predict import ArticleRequest, ModelsResponse, PredictionResponse
from services.history_service import create_history_entry
from services.inference import get_available_models, get_default_model_id, run_inference

router = APIRouter(tags=["prediction"])


@router.get("/models", response_model=ModelsResponse)
def list_models():
    return {
        "models": get_available_models(),
        "default_model": get_default_model_id(),
    }


@router.post("/predict", response_model=PredictionResponse)
def predict(request: ArticleRequest, current_user: dict = Depends(get_current_user)):
    article = request.article.strip()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Article text is required.",
        )

    prediction = run_inference(article, request.model_id)
    history_item = create_history_entry(
        user_id=current_user["id"],
        article=article,
        headline=prediction["headline"],
        category=prediction["category"],
        model_used=prediction["model_used"],
    )

    return {
        **prediction,
        "history_id": history_item["id"],
        "created_at": history_item["created_at"],
    }
