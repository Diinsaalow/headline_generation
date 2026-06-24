import re
from pathlib import Path

import torch
from fastapi import HTTPException, status
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODELS_DIR = Path("models")
MAX_INPUT_LENGTH = 512
MAX_TARGET_LENGTH = 96
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_DEFAULT_MODEL_ID: str | None = None
_model_cache: dict[str, dict] = {}


def get_available_models() -> list[dict]:
    if not MODELS_DIR.exists():
        return []

    available = []
    for folder in sorted(MODELS_DIR.iterdir()):
        if folder.is_dir() and (folder / "config.json").exists():
            available.append(
                {
                    "id": folder.name,
                    "name": folder.name.replace("-", " ").replace("_", " ").title(),
                }
            )

    return available


def get_default_model_id() -> str | None:
    return _DEFAULT_MODEL_ID


def load_model(model_id: str) -> dict:
    if model_id in _model_cache:
        return _model_cache[model_id]

    model_path = MODELS_DIR / model_id
    if not model_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Model '{model_id}' not found. Available models: "
                f"{[model['id'] for model in get_available_models()]}"
            ),
        )

    if not (model_path / "config.json").exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Folder '{model_id}' exists but is missing config.json "
                "so it is not a valid model."
            ),
        )

    tokenizer = AutoTokenizer.from_pretrained(str(model_path), use_fast=False)
    model = AutoModelForSeq2SeqLM.from_pretrained(str(model_path))
    model.to(DEVICE)
    model.eval()

    _model_cache[model_id] = {"model": model, "tokenizer": tokenizer}
    return _model_cache[model_id]


def initialize_default_model() -> None:
    global _DEFAULT_MODEL_ID

    available_models = get_available_models()
    if not available_models:
        _DEFAULT_MODEL_ID = None
        return

    _DEFAULT_MODEL_ID = available_models[0]["id"]
    load_model(_DEFAULT_MODEL_ID)


def normalize_spaces(text: str) -> str:
    text = str(text)
    text = re.sub(r"[\r\n\t\xa0]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def parse_generated_output(text: str) -> tuple[str, str]:
    cleaned_text = normalize_spaces(text)

    if "||" in cleaned_text:
        headline_part, category_part = cleaned_text.split("||", 1)
    else:
        headline_part = cleaned_text
        category_part = ""

    headline = re.sub(
        r"^\s*headline\s*:\s*", "", headline_part, flags=re.IGNORECASE
    ).strip()

    match = re.search(
        r"category\s*:\s*([a-zA-Z_]+)", category_part, flags=re.IGNORECASE
    )
    category = match.group(1).strip().lower() if match else "unknown"
    return headline, category


def run_inference(article_body: str, model_id: str | None) -> dict:
    resolved_model_id = model_id or _DEFAULT_MODEL_ID
    if not resolved_model_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No models are available.",
        )

    loaded = load_model(resolved_model_id)
    model = loaded["model"]
    tokenizer = loaded["tokenizer"]

    input_text = "generate Somali headline and category: " + normalize_spaces(
        article_body
    )
    encoded = tokenizer(
        input_text,
        max_length=MAX_INPUT_LENGTH,
        truncation=True,
        return_tensors="pt",
    ).to(DEVICE)

    with torch.no_grad():
        generated_ids = model.generate(
            **encoded,
            max_length=MAX_TARGET_LENGTH,
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=3,
        )

    generated_text = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
    headline, category = parse_generated_output(generated_text)

    return {
        "headline": headline or "No headline generated.",
        "category": category or "unknown",
        "model_used": resolved_model_id,
    }


def get_runtime_status() -> dict:
    return {
        "device": DEVICE,
        "default_model": _DEFAULT_MODEL_ID,
        "models_loaded": list(_model_cache.keys()),
    }
