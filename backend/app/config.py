from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    DATABASE_URL: str = Field(..., env="DATABASE_URL", secret=True)
    ENVIRONMENT: str = Field(..., env="ENVIRONMENT")


settings = Settings()
