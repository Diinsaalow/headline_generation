from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from db.mongodb import close_mongo_connection, connect_to_mongo, get_mongo_status
from middleware.jwt_auth import JWTAuthMiddleware
from routers.auth import router as auth_router
from routers.history import router as history_router
from routers.predict import router as predict_router
from services.inference import get_runtime_status, initialize_default_model

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    connect_to_mongo()
    initialize_default_model()
    yield
    close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    description=(
        "Generate Somali news headlines and classify article categories "
        "using fine-tuned mT5 models."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.client_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTAuthMiddleware)

app.include_router(auth_router)
app.include_router(history_router)
app.include_router(predict_router)


@app.get("/")
def home():
    return {
        "message": "Somali Headline Generation API is running.",
        **get_runtime_status(),
        **get_mongo_status(),
    }
