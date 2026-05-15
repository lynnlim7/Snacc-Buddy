from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/snacc_buddy"
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:8081", "exp://localhost:8081"]
    MAX_IMAGE_SIZE_MB: int = 10


settings = Settings()
