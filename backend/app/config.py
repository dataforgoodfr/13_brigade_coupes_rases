import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # En test, on ignore toujours le .env local du développeur : les tests
        # doivent lire la configuration de .env.test (jeton d'import, base).
        env_file=(
            ".env.test"
            if os.environ.get("ENVIRONMENT") == "test"
            else (".env" if os.path.exists(".env") else ".env.development")
        )
    )
    DATABASE_URL: str = Field(
        ..., json_schema_extra={"env": "DATABASE_URL", "secret": True}
    )
    ENVIRONMENT: str = Field(..., json_schema_extra={"env": "ENVIRONMENT"})
    PORT: int = Field(..., json_schema_extra={"env": "PORT"})
    JWT_SECRET_KEY: str = Field(
        ..., json_schema_extra={"env": "JWT_SECRET_KEY", "secret": True}
    )
    ALLOWED_ORIGINS: str = Field(
        default="",
        json_schema_extra={"env": "ALLOWED_ORIGINS"},
        description="List of allowed origins for CORS, each origin should be separated with a comma. E.g : origin1,origin2",
    )
    DB_POOL_SIZE: int = Field(
        default=3,
        json_schema_extra={"env": "DB_POOL_SIZE"},
        description="Persistent connections kept in the SQLAlchemy pool. Keep pool + overflow below the database plan's connection limit",
    )
    DB_MAX_OVERFLOW: int = Field(
        default=2,
        json_schema_extra={"env": "DB_MAX_OVERFLOW"},
        description="Extra connections opened under load, closed when idle",
    )
    DB_POOL_RECYCLE_SECONDS: int = Field(
        default=1800,
        json_schema_extra={"env": "DB_POOL_RECYCLE_SECONDS"},
        description="Recycle connections older than this, to survive server-side idle timeouts",
    )
    MAP_MAX_POINTS: int = Field(
        default=2000,
        json_schema_extra={"env": "MAP_MAX_POINTS"},
        description="Maximum number of individual points returned by the map endpoint; `total` still counts them all",
    )
    API_DOCS_ENABLED: bool = Field(
        default=False,
        json_schema_extra={"env": "API_DOCS_ENABLED"},
        description="Expose /docs, /redoc and /openapi.json in production (always exposed elsewhere)",
    )
    SQL_ECHO: bool = Field(
        default=False,
        json_schema_extra={"env": "SQL_ECHO"},
        description="Log every SQL statement and its parameters (development only: parameters include personal data)",
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

    FRONTEND_URL: str = Field(
        default="http://localhost:5173",
        json_schema_extra={"env": "FRONTEND_URL"},
        description="Public URL of the frontend, used in links sent by email",
    )
    SMTP_HOST: str = Field(
        default="",
        json_schema_extra={"env": "SMTP_HOST"},
        description="SMTP relay host (e.g. smtp-relay.brevo.com). Empty: emails are only logged",
    )
    SMTP_PORT: int = Field(default=587, json_schema_extra={"env": "SMTP_PORT"})
    SMTP_USE_TLS: bool = Field(
        default=True,
        json_schema_extra={"env": "SMTP_USE_TLS"},
        description="Upgrade the connection with STARTTLS (port 587). Off for local Mailpit",
    )
    SMTP_USER: str = Field(default="", json_schema_extra={"env": "SMTP_USER"})
    SMTP_PASSWORD: str = Field(
        default="", json_schema_extra={"env": "SMTP_PASSWORD", "secret": True}
    )
    SMTP_FROM: str = Field(
        default="Brigade des coupes rases <no-reply@canopee.ong>",
        json_schema_extra={"env": "SMTP_FROM"},
        description="Sender address; the domain must be verified at the email provider",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def allowed_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def api_docs_enabled(self) -> bool:
        return self.API_DOCS_ENABLED or not self.is_production


MIN_JWT_SECRET_KEY_LENGTH = 32


def check_production_settings(settings: Settings) -> None:
    """Refuse to start in production with a weak JWT_SECRET_KEY."""
    if (
        settings.is_production
        and len(settings.JWT_SECRET_KEY) < MIN_JWT_SECRET_KEY_LENGTH
    ):
        raise RuntimeError(
            f"JWT_SECRET_KEY must be at least {MIN_JWT_SECRET_KEY_LENGTH} characters "
            "in production (generate one with: openssl rand -hex 32)"
        )


settings = Settings()
check_production_settings(settings)
