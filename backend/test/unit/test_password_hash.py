from app.services.get_password_hash import (
    BCRYPT_MAX_BYTES,
    get_password_hash,
    password_to_bytes,
)
from app.services.user_auth import verify_password


def test_hash_is_salted_and_verifiable() -> None:
    first = get_password_hash("secret")
    second = get_password_hash("secret")

    assert first != second
    assert verify_password("secret", first)
    assert verify_password("secret", second)
    assert not verify_password("wrong", first)


def test_password_is_truncated_to_bcrypt_limit() -> None:
    long_password = "é" * 50  # 100 octets en UTF-8

    assert len(password_to_bytes(long_password)) == BCRYPT_MAX_BYTES
    assert password_to_bytes("abc") == b"abc"


def test_passwords_sharing_the_first_72_bytes_are_equivalent() -> None:
    base = "a" * BCRYPT_MAX_BYTES
    hashed = get_password_hash(base + "suffix")

    assert verify_password(base, hashed)
    assert not verify_password(base[:-1], hashed)
