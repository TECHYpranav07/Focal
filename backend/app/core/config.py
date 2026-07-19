from pathlib import Path
import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Debug mode
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./focal.db"

    # CORS
    CORS_ORIGINS: str = ""

    # JWT
    SECRET_KEY: str | None = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Uploads
    UPLOAD_DIR: str = "uploads"

    # Face matching
    RECOGNITION_MODEL: str = "ArcFace"
    SIMILARITY_THRESHOLD: float = 0.38
    FALLBACK_THRESHOLD: float = 0.32
    DETECTOR_BACKEND: str = "retinaface"
    INSURANCE_THRESHOLD: float = 0.28
    ENABLE_INSURANCE_MATCHING: bool = True

    # Migrations
    ALLOW_DESTRUCTIVE_MIGRATION: bool = False

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if not self.SECRET_KEY:
            if self.DEBUG:
                self.SECRET_KEY = "dev-only-insecure-key-use-only-for-local-testing"
                logger = logging.getLogger("uvicorn.error")
                logger.warning(
                    "\n"
                    "────────────────────────────────────────────────────────\n"
                    "🚨 WARNING: SECRET_KEY is missing!                        \n"
                    "   Using an insecure default key because DEBUG is enabled.  \n"
                    "   DO NOT USE THIS IN PRODUCTION!                           \n"
                    "────────────────────────────────────────────────────────"
                )
            else:
                raise ValueError("SECRET_KEY must be configured in environment or .env file when DEBUG is False.")
        return self

    @property
    def photos_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "photos"

    @property
    def selfies_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "selfies"


settings = Settings()
