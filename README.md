# Somali Headline Generation API

FastAPI backend for generating Somali news headlines and classifying article categories using a fine-tuned mT5 model.

## Run locally

```bash
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```
