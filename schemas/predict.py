from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ModelInputLimits(BaseModel):
    max_input_tokens: int = Field(ge=1)
    max_article_characters: int = Field(ge=1)
    min_article_words: int = Field(ge=1)


class ArticleRequest(BaseModel):
    article: str = Field(min_length=1)
    model_id: str | None = None


class PredictionResponse(BaseModel):
    history_id: str
    headline: str
    category: str
    model_used: str
    status: Literal["success", "failed"] = "success"
    error_message: str | None = None
    created_at: datetime


class ModelInfo(ModelInputLimits):
    id: str
    name: str


class ModelsResponse(ModelInputLimits):
    models: list[ModelInfo]
    default_model: str | None
