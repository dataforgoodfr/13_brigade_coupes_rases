import pytest

from pipeline.scripts.database import sqlalchemy_url


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
def test_sqlalchemy_url_uses_psycopg(url: str, expected: str) -> None:
    assert sqlalchemy_url(url) == expected
