from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./focal.db"

    # CORS
    CORS_ORIGINS: str = ""

    # JWT
    SECRET_KEY: str = "super-secret-key-change-in-production"
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

    @property
    def photos_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "photos"

    @property
    def selfies_dir(self) -> Path:
        return Path(self.UPLOAD_DIR) / "selfies"


settings = Settings()
