from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Load .env from backend root, even when uvicorn runs from another cwd.
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = Field(default="Sententia Back", alias="APP_NAME")
    environment: Literal["local", "staging", "production"] = Field(default="local", alias="ENVIRONMENT")
    debug: bool = Field(default=True, alias="DEBUG")
    api_prefix: str = Field(default="/api/v1", alias="API_PREFIX")

    pinecone_api_key: str = Field(default="", alias="PINECONE_API_KEY")
    pinecone_assistant_name: str = Field(default="", alias="PINECONE_ASSISTANT_NAME")
    pinecone_assistant_name_legacy: str = Field(default="", alias="PINECONE_INDEX_NAME")
    pinecone_assistant_model: str = Field(default="gpt-4o", alias="PINECONE_ASSISTANT_MODEL")
    pinecone_assistant_region: Literal["us", "eu"] = Field(default="us", alias="PINECONE_ASSISTANT_REGION")
    cors_allow_origins: str = Field(
        default="",
        alias="CORS_ALLOW_ORIGINS",
    )

    @property
    def pinecone_runtime_assistant_name(self) -> str:
        # Backward compatibility while migrating env var name.
        return self.pinecone_assistant_name or self.pinecone_assistant_name_legacy

    @property
    def pinecone_enabled(self) -> bool:
        # Assistant routes are considered enabled only with API key + assistant name.
        return bool(self.pinecone_api_key and self.pinecone_runtime_assistant_name)

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
