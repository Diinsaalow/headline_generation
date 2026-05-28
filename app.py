from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import re
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────

MODEL_DIR = Path("model")

MAX_INPUT_LENGTH = 512
MAX_TARGET_LENGTH = 96

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── Load model once when server starts ───────────────────────────────────────

print("Loading model...")
print("Device:", DEVICE)

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, use_fast=False)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_DIR)
model.to(DEVICE)
model.eval()

print("Model loaded successfully.")


# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Somali Headline Generation API",
    description="Generate Somali news headline and classify article category using fine-tuned mT5.",
    version="1.0.0",
)

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request/Response schemas ────────────────────────────────────────────────

class ArticleRequest(BaseModel):
    article: str


class PredictionResponse(BaseModel):
    headline: str
    category: str
    generated_text: str


# ── Helper functions ─────────────────────────────────────────────────────────

def normalize_spaces(text: str) -> str:
    text = str(text)
    text = re.sub(r"[\r\n\t\xa0]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def parse_generated_output(text: str):
    """
    Expected format:
    headline: ... || category: ...
    """
    text = normalize_spaces(text)

    headline = text
    category = "unknown"

    if "||" in text:
        headline_part, category_part = text.split("||", 1)
    else:
        headline_part = text
        category_part = ""

    headline = re.sub(
        r"^\s*headline\s*:\s*",
        "",
        headline_part,
        flags=re.IGNORECASE
    ).strip()

    match = re.search(
        r"category\s*:\s*([a-zA-Z_]+)",
        category_part,
        flags=re.IGNORECASE
    )

    if match:
        category = match.group(1).strip().lower()

    return headline, category


def generate_headline_and_category(article_body: str):
    article_body = normalize_spaces(article_body)

    input_text = "generate Somali headline and category: " + article_body

    encoded = tokenizer(
        input_text,
        max_length=MAX_INPUT_LENGTH,
        truncation=True,
        return_tensors="pt"
    ).to(DEVICE)

    with torch.no_grad():
        generated_ids = model.generate(
            **encoded,
            max_length=MAX_TARGET_LENGTH,
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=3
        )

    generated_text = tokenizer.decode(
        generated_ids[0],
        skip_special_tokens=True
    )

    headline, category = parse_generated_output(generated_text)

    return {
        "headline": headline,
        "category": category,
        "generated_text": generated_text,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "message": "Somali Headline Generation API is running.",
        "device": DEVICE,
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(request: ArticleRequest):
    if not request.article.strip():
        return {
            "headline": "",
            "category": "unknown",
            "generated_text": "",
        }

    result = generate_headline_and_category(request.article)

    return result