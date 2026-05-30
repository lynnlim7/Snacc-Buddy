from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/snacc_buddy"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_TEMPERATURE: float = 0.2
    GEMINI_TIMEOUT_SECONDS: float = 30.0

    REDIS_URL: str = "redis://localhost:6379"
    GEMINI_CACHE_TTL_SECONDS: int = 86400   # 24 h — same meal, same calories
    GEMINI_DEDUP_TTL_SECONDS: int = 60       # lock held while Gemini processes
    AI_RATE_LIMIT_REQUESTS: int = 10
    AI_RATE_LIMIT_WINDOW_SECONDS: int = 60 * 60

    CORS_ORIGINS: list[str] = ["http://localhost:8081", "exp://localhost:8081"]
    MAX_IMAGE_SIZE_MB: int = 10

    JWT_SECRET: str = "change-me-jwt-secret"
    JWT_LIFETIME_SECONDS: int = 3600
    RESET_PASSWORD_TOKEN_SECRET: str = "change-me-reset-password-secret"
    VERIFICATION_TOKEN_SECRET: str = "change-me-verification-secret"

    FRONTEND_RESET_PASSWORD_URL: str = "http://localhost:8081/reset-password"

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: EmailStr
    MAIL_PORT: int = 587
    MAIL_SERVER: str
    MAIL_FROM_NAME: str = "Snacc Buddy"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False


settings = Settings()
