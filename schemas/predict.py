from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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


class ModelInfo(BaseModel):
    id: str
    name: str


class ModelsResponse(BaseModel):
    models: list[ModelInfo]
    default_model: str | None
