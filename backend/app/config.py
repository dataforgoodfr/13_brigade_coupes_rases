import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            ".env"
            if os.path.exists(".env")
            else (
                ".env.test"
                if os.environ.get("ENVIRONMENT") == "test"
                else ".env.development"
            )
        )
    )
    DATABASE_URL: str = Field(
        ..., json_schema_extra={"env": "DATABASE_URL", "secret": True}
    )
    ENVIRONMENT: str = Field(..., json_schema_extra={"env": "ENVIRONMENT"})
    JWT_SECRET_KEY: str = Field(
        ..., json_schema_extra={"env": "JWT_SECRET_KEY", "secret": True}
    )
    ALLOWED_ORIGINS: str = Field(
        default="",
        json_schema_extra={"env": "ALLOWED_ORIGINS"},
        description="List of allowed origins for CORS, each origin should be separated with a comma. E.g : origin1,origin2",
    )
    IMPORTS_TOKEN: str = Field(
        default="", json_schema_extra={"env": "IMPORTS_TOKEN", "secret": True}
    )
    S3_ACCESS_KEY_ID: str = Field(
        default="",
        json_schema_extra={"env": "S3_ACCESS_KEY", "secret": True},
        description="Access key ID for the S3 bucket for photos storage",
    )
    S3_SECRET_ACCESS_KEY: str = Field(
        default="",
        json_schema_extra={"env": "S3_SECRET_ACCESS_KEY", "secret": True},
        description="Secret access key for the S3 bucket for photos storage",
    )
    S3_BUCKET_NAME: str = Field(
        default="",
        json_schema_extra={"env": "S3_BUCKET_NAME"},
        description="Name of the S3 bucket for photos storage",
    )
    S3_PREFIX: str = Field(
        default="",
        json_schema_extra={"env": "S3_PREFIX"},
        description="Prefix for the S3 bucket for photos storage, useful to organize photos in subfolders and to differentiate between different environments (e.g., 'development/', 'production/')",
    )
    S3_REGION: str = Field(
        default="",
        json_schema_extra={"env": "S3_REGION"},
        description="Region of the S3 bucket for photos storage",
    )
    S3_ENDPOINT: str = Field(
        default="",
        json_schema_extra={"env": "S3_ENDPOINT"},
        description="Endpoint URL of the S3 bucket for photos storage",
    )


settings = Settings()  # type: ignore[call-arg]
