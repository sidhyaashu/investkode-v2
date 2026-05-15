from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Auth Service"

    DATABASE_URL: str
    REDIS_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    INTERNAL_SECRET: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    CLIENT_URL: str

    # SMTP
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASS: str
    EMAIL_FROM: str

    # Cookie
    COOKIE_SECURE: bool = False  # Set to True in production

    # Limits & Thresholds
    OTP_EXPIRY_SECONDS: int = 300
    OTP_RATE_LIMIT_WINDOW: int = 60
    OTP_RATE_LIMIT_MAX: int = 5
    LOGIN_RATE_LIMIT_WINDOW: int = 300
    LOGIN_RATE_LIMIT_MAX: int = 10
    MAX_SESSIONS_PER_USER: int = 5
    TOKEN_BLACKLIST_TTL: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
