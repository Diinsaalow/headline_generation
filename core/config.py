import os
from functools import lru_cache

from pydantic import BaseModel, Field


def parse_client_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    origins = [item.strip() for item in raw_value.split(",")]
    return [origin for origin in origins if origin]


class Settings(BaseModel):
    app_name: str = "Somali Headline Generation API"
    mongodb_uri: str = Field(
        default_factory=lambda: os.getenv("MONGODB_URI", "mongodb+srv://graduation:xfat7cAQHYVJOncQ@headline-generation.fxvjuok.mongodb.net/?appName=headline-generation")
    )
    mongodb_database: str = Field(
        default_factory=lambda: os.getenv("MONGODB_DB_NAME", "headline-generation")
    )
    jwt_secret_key: str = Field(
        default_factory=lambda: os.getenv(
            "JWT_SECRET_KEY", "r5u4Og74QeZMIkaB0wU7YWaIWdwQ6SklD0aTqaM4Yc8="
        )
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    )
    client_origins: list[str] = Field(
        default_factory=lambda: parse_client_origins(os.getenv("CLIENT_ORIGINS"))
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
