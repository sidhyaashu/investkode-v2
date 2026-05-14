from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "InvestCode Gateway"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    INTERNAL_SECRET: str

    # Services
    AUTH_SERVICE_URL: str
    WATCHLIST_SERVICE_URL: str

    # Redis
    REDIS_URL: str

    # Limits
    MAX_REQUEST_SIZE: int = 10485760  # 10MB

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
