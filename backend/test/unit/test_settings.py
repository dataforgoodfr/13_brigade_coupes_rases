import pytest

from app.config import Settings, check_production_settings


def make_settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "DATABASE_URL": "postgresql://x",
        "ENVIRONMENT": "development",
        "PORT": 8080,
        "JWT_SECRET_KEY": "short",
    }
    values.update(overrides)
    return Settings(**values)  # type: ignore[arg-type]


def test_allowed_origins_are_trimmed_and_empty_entries_dropped() -> None:
    settings = make_settings(
        ALLOWED_ORIGINS=" http://localhost:5173 ,https://example.org,, "
    )

    assert settings.allowed_origins == ["http://localhost:5173", "https://example.org"]
    assert make_settings(ALLOWED_ORIGINS="").allowed_origins == []


def test_api_docs_are_off_in_production_unless_enabled() -> None:
    assert make_settings().api_docs_enabled
    assert not make_settings(ENVIRONMENT="production").api_docs_enabled
    assert make_settings(
        ENVIRONMENT="production", API_DOCS_ENABLED=True
    ).api_docs_enabled


def test_short_jwt_secret_is_refused_in_production_only() -> None:
    check_production_settings(make_settings())

    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
        check_production_settings(make_settings(ENVIRONMENT="production"))

    check_production_settings(
        make_settings(ENVIRONMENT="production", JWT_SECRET_KEY="x" * 32)
    )


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("postgresql://u:p@h:5432/db", "postgresql+psycopg://u:p@h:5432/db"),
        ("postgres://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        # An explicit driver is left alone
        ("postgresql+psycopg://u@h/db", "postgresql+psycopg://u@h/db"),
        ("postgresql+psycopg2://u@h/db", "postgresql+psycopg2://u@h/db"),
    ],
)
def test_database_url_uses_psycopg(url: str, expected: str) -> None:
    assert make_settings(DATABASE_URL=url).DATABASE_URL == expected
