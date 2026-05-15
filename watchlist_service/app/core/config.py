from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "InvestKode Watchlist Service"

    # Write DB: user watchlists
    WATCHLIST_DATABASE_URL: str

    # Read-only DB: financial/provider data
    FINANCIAL_DATABASE_URL: str

    INTERNAL_SECRET: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()