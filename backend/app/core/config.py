from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Flliter Mobile Backend"

    # SQLite for local dev. In production, replace with Postgres.
    database_url: str = "sqlite:///./flliter_mobile.db"

    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

