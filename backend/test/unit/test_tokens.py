from datetime import timedelta

from app.services.user_auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_access_token_round_trip() -> None:
    token = create_access_token({"sub": "alice@example.com"})

    assert decode_token(token) == "alice@example.com"


def test_refresh_token_is_read_with_its_own_key() -> None:
    token = create_refresh_token({"email": "alice@example.com"})

    assert decode_token(token, key="email", type="refresh") == "alice@example.com"
    assert decode_token(token, key="email") == "alice@example.com"


def test_expired_token_is_rejected() -> None:
    token = create_access_token(
        {"sub": "alice@example.com"}, expires_delta=timedelta(seconds=-1)
    )

    assert decode_token(token) is None


def test_missing_claim_returns_none() -> None:
    token = create_access_token({"sub": "alice@example.com"})

    assert decode_token(token, key="email") is None


def test_garbage_token_returns_none() -> None:
    assert decode_token("not-a-jwt") is None
    assert decode_token("") is None
