from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    DATABASE_URL: str = Field(..., json_schema_extra={"env": "DATABASE_URL", "secret": True})
    ENVIRONMENT: str = Field(..., json_schema_extra={"env": "ENVIRONMENT"})


settings = Settings()
