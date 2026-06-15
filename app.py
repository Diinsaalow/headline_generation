from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import re
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
# Each subfolder inside MODELS_DIR is one model.
# Structure:
#   models/
#     mt5-small-v1/        ← first trained model
#     mt5-base-v2/         ← second trained model
#     mt5-small-ciyaaro/   ← model trained with ciyaaro added
#
# Rename your existing 'model/' folder to 'models/mt5-small-v1/' (or any name).

MODELS_DIR = Path("models")

MAX_INPUT_LENGTH  = 512
MAX_TARGET_LENGTH = 96
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Device: {DEVICE}")

# ── Model registry ────────────────────────────────────────────────────────────
# Holds loaded models in memory so we don't reload on every request.
# Key   = model folder name (e.g. 'mt5-small-v1')
# Value = {'model': ..., 'tokenizer': ...}
# Models are lazy-loaded: only loaded when first requested, then cached here.

_model_cache: dict = {}


def get_available_models() -> list[dict]:
    """
    Scans the models/ directory and returns all valid model folders.
    A folder is valid if it contains a config.json file (Hugging Face standard).
    """
    if not MODELS_DIR.exists():
        return []

    available = []
    for folder in sorted(MODELS_DIR.iterdir()):
        if folder.is_dir() and (folder / "config.json").exists():
            available.append({
                "id":   folder.name,               # used in API requests
                "name": folder.name.replace("-", " ").replace("_", " ").title(),
            })
    return available


def load_model(model_id: str) -> dict:
    """
    Loads a model and tokenizer from models/<model_id>/ and caches it.
    Returns the cached version if already loaded.

    Raises HTTPException 404 if the model folder does not exist.
    """
    # Return from cache if already loaded
    if model_id in _model_cache:
        return _model_cache[model_id]

    model_path = MODELS_DIR / model_id

    # Validate the model folder exists and looks like a Hugging Face model
    if not model_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_id}' not found. "
                   f"Available models: {[m['id'] for m in get_available_models()]}"
        )

    if not (model_path / "config.json").exists():
        raise HTTPException(
            status_code=400,
            detail=f"Folder '{model_id}' exists but does not contain a valid model (missing config.json)."
        )

    print(f"Loading model: {model_id} ...")
    tokenizer = AutoTokenizer.from_pretrained(str(model_path), use_fast=False)
    model     = AutoModelForSeq2SeqLM.from_pretrained(str(model_path))
    model.to(DEVICE)
    model.eval()
    print(f"  ✔ {model_id} loaded.")

    _model_cache[model_id] = {"model": model, "tokenizer": tokenizer}
    return _model_cache[model_id]


# ── Pre-load the first available model at startup ─────────────────────────────
# So the first request is not slow. Skips gracefully if models/ is empty.

available_at_startup = get_available_models()

if available_at_startup:
    DEFAULT_MODEL_ID = available_at_startup[0]["id"]
    load_model(DEFAULT_MODEL_ID)
    print(f"Default model: {DEFAULT_MODEL_ID}")
else:
    DEFAULT_MODEL_ID = None
    print("⚠ No models found in models/ — add a model folder and restart.")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Somali Headline Generation API",
    description=(
        "Generate Somali news headline and classify article category "
        "using fine-tuned mT5. Supports multiple model versions."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ────────────────────────────────────────────────

class ArticleRequest(BaseModel):
    article:   str
    model_id:  str | None = None   # if None, uses the default (first) model

    class Config:
        json_schema_extra = {
            "example": {
                "article":  "Dowladda Soomaaliya ayaa maanta...",
                "model_id": "mt5-small-v1",
            }
        }


class PredictionResponse(BaseModel):
    headline:    str
    category:    str
    model_used:  str    # tells the frontend which model produced the result


class ModelInfo(BaseModel):
    id:   str
    name: str


class ModelsResponse(BaseModel):
    models:        list[ModelInfo]
    default_model: str | None


# ── Helper functions ──────────────────────────────────────────────────────────

def normalize_spaces(text: str) -> str:
    """Collapses all whitespace variants into a single space."""
    text = str(text)
    text = re.sub(r"[\r\n\t\xa0]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def parse_generated_output(text: str) -> tuple[str, str]:
    """
    Parses the model's combined output.
    Expected format: 'headline: ... || category: ...'
    Falls back gracefully if the format is missing.
    """
    text = normalize_spaces(text)

    if "||" in text:
        headline_part, category_part = text.split("||", 1)
    else:
        headline_part = text
        category_part = ""

    headline = re.sub(
        r"^\s*headline\s*:\s*", "", headline_part, flags=re.IGNORECASE
    ).strip()

    match = re.search(
        r"category\s*:\s*([a-zA-Z_]+)", category_part, flags=re.IGNORECASE
    )
    category = match.group(1).strip().lower() if match else "unknown"

    return headline, category


def run_inference(article_body: str, model_id: str) -> dict:
    """
    Runs inference using the specified model.
    Loads the model if not already in cache.
    """
    # Resolve default
    resolved_id = model_id or DEFAULT_MODEL_ID
    if not resolved_id:
        raise HTTPException(status_code=503, detail="No models available.")

    # Load (or retrieve cached) model
    loaded = load_model(resolved_id)
    mdl    = loaded["model"]
    tok    = loaded["tokenizer"]

    body = normalize_spaces(article_body)
    input_text = "generate Somali headline and category: " + body

    encoded = tok(
        input_text,
        max_length=MAX_INPUT_LENGTH,
        truncation=True,
        return_tensors="pt",
    ).to(DEVICE)

    with torch.no_grad():
        generated_ids = mdl.generate(
            **encoded,
            max_length=MAX_TARGET_LENGTH,
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=3,
        )

    generated_text = tok.decode(generated_ids[0], skip_special_tokens=True)
    headline, category = parse_generated_output(generated_text)

    return {
        "headline":   headline,
        "category":   category,
        "model_used": resolved_id,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "message":       "Somali Headline Generation API is running.",
        "device":        DEVICE,
        "default_model": DEFAULT_MODEL_ID,
        "models_loaded": list(_model_cache.keys()),
    }


@app.get("/models", response_model=ModelsResponse)
def list_models():
    """
    Returns all available models.
    The frontend calls this to populate the dropdown.
    """
    return {
        "models":        get_available_models(),
        "default_model": DEFAULT_MODEL_ID,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(request: ArticleRequest):
    """
    Generates a headline and classifies the category.
    Pass model_id to select which model to use.
    If model_id is omitted, the default (first) model is used.
    """
    if not request.article.strip():
        return {
            "headline":   "",
            "category":   "unknown",
            "model_used": request.model_id or DEFAULT_MODEL_ID or "",
        }

    return run_inference(request.article, request.model_id)