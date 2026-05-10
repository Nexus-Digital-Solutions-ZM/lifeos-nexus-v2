# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional, Literal


class Settings(BaseSettings):
    # Pydantic v2 config: allow loading from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # ← Allow extra env vars without error (safe for dev)
    )

    # ===========================
    # App Settings
    # ===========================
    APP_NAME: str = "LifeOS"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ===========================
    # Database
    # ===========================
    DATABASE_URL: str = "sqlite:///./lifeos.db"

    # ===========================
    # Frontend / CORS
    # ===========================
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def allowed_origins(self) -> list[str]:
        """CORS allowed origins"""
        origins = [self.FRONTEND_URL]
        if self.FRONTEND_URL.startswith("http://localhost"):
            origins.extend([
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ])
        return origins

    # ===========================
    # 🤖 Ollama (Local Qwen) — NEW FIELDS
    # ===========================
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen:4b"
    OLLAMA_TIMEOUT: int = 120

    # ===========================
    # Email (Resend)
    # ===========================
    RESEND_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@nexusdigitalsolutions.zm"

    # ===========================
    # SMS/WhatsApp (Africa's Talking)
    # ===========================
    AT_USERNAME: Optional[str] = None
    AT_API_KEY: Optional[str] = None
    AT_SENDER_ID: str = "LifeOS"

    # ===========================
    # Admin Seed
    # ===========================
    ADMIN_EMAIL: str = "admin@nexusdigitalsolutions.zm"
    ADMIN_PASSWORD: str = "changeme_on_first_run!"

    # ===========================
    # Logging
    # ===========================
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance (singleton pattern)"""
    return Settings()


# Export singleton for easy import
settings = get_settings()