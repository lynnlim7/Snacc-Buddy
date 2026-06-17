from pydantic import EmailStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRETS = frozenset({
    "change-me-jwt-secret",
    "change-me-reset-password-secret",
    "change-me-verification-secret",
})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "development"

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

    CLOUDFLARE_R2_ACCOUNT_ID: str = ""
    CLOUDFLARE_R2_ACCESS_KEY_ID: str = ""
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: str = ""
    CLOUDFLARE_R2_BUCKET_NAME: str = ""
    CLOUDFLARE_R2_PUBLIC_URL: str = ""

    @model_validator(mode="after")
    def _check_secrets(self) -> "Settings":
        if self.ENV not in ("development", "test"):
            if self.JWT_SECRET in _DEFAULT_SECRETS:
                raise ValueError("JWT_SECRET must not be the default value in non-development environments.")
            if self.RESET_PASSWORD_TOKEN_SECRET in _DEFAULT_SECRETS:
                raise ValueError("RESET_PASSWORD_TOKEN_SECRET must not be the default value in non-development environments.")
            if self.VERIFICATION_TOKEN_SECRET in _DEFAULT_SECRETS:
                raise ValueError("VERIFICATION_TOKEN_SECRET must not be the default value in non-development environments.")
        return self


settings = Settings()
