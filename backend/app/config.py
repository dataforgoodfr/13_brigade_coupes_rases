import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            ".env"
            if os.path.exists(".env")
            else (
                ".env.test" if os.environ.get("ENVIRONMENT") == "test" else ".env.development"
            )
        )
    )
    DATABASE_URL: str = Field(..., json_schema_extra={"env": "DATABASE_URL", "secret": True})
    ENVIRONMENT: str = Field(..., json_schema_extra={"env": "ENVIRONMENT"})
    JWT_SECRET_KEY: str = Field(
        ..., json_schema_extra={"env": "JWT_SECRET_KEY", "secret": True}
    )
    ALLOWED_ORIGINS: str = Field(
        default="",
        json_schema_extra={"env": "ALLOWED_ORIGINS"},
        description="List of allowed origins for CORS, each origin should be separated with a comma. E.g : origin1,origin2",
    )


settings = Settings()
