from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import jwt
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.services.user_auth import ALGORITHM, SECRET_KEY, create_access_token
from test.common.user import create_user, new_user


def test_forgot_password_sends_email_to_existing_user(
    client: TestClient, db: Session
) -> None:
    user = create_user(db, email="forgot@volunteer.com")

    with patch("app.routes.auth.send_reset_password_email") as send_mail:
        response = client.post(
            "/api/v1/auth/forgot-password", json={"email": user.email}
        )

    assert response.status_code == status.HTTP_200_OK
    send_mail.assert_called_once()
    assert send_mail.call_args.args[0] == user.email


def test_forgot_password_unknown_email_is_silent(
    client: TestClient, db: Session
) -> None:
    with patch("app.routes.auth.send_reset_password_email") as send_mail:
        response = client.post(
            "/api/v1/auth/forgot-password", json={"email": "nobody@nowhere.org"}
        )

    assert response.status_code == status.HTTP_200_OK
    send_mail.assert_not_called()


def test_reset_password_round_trip(client: TestClient, db: Session) -> None:
    user = create_user(db, email="reset@volunteer.com")

    with patch("app.routes.auth.send_reset_password_email") as send_mail:
        client.post("/api/v1/auth/forgot-password", json={"email": user.email})
    reset_token = send_mail.call_args.args[1]

    response = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "new-password"},
    )
    assert response.status_code == status.HTTP_200_OK

    login = client.post(
        "/api/v1/token", data={"username": user.email, "password": "new-password"}
    )
    assert login.status_code == status.HTTP_200_OK


def test_login_with_password_longer_than_72_bytes(
    client: TestClient, db: Session
) -> None:
    long_password = "x" * 100
    user = new_user(email="long-password@example.com", password=long_password)
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/token",
        data={"username": user.email, "password": long_password},
    )

    assert response.status_code == 200


def test_register_creates_an_inactive_volunteer(
    client: TestClient, db: Session
) -> None:
    payload = {
        "first_name": "Nina",
        "last_name": "Nouvelle",
        "email": "nina@example.com",
        "login": "nina",
        "password": "secret",
    }

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "nina@example.com"
    assert data["role"] == "volunteer"

    # Le compte attend la validation d'un administrateur.
    login = client.post(
        "/api/v1/token", data={"username": "nina@example.com", "password": "secret"}
    )
    assert login.status_code == status.HTTP_401_UNAUTHORIZED
    assert login.json()["detail"]["type"] == "USER_INACTIVE"


def test_register_refuses_an_existing_login_or_email(
    client: TestClient, db: Session
) -> None:
    create_user(db, email="taken@example.com", login="taken")
    payload = {
        "first_name": "Nina",
        "last_name": "Nouvelle",
        "password": "secret",
    }

    same_email = client.post(
        "/api/v1/auth/register",
        json={**payload, "email": "taken@example.com", "login": "free"},
    )
    same_login = client.post(
        "/api/v1/auth/register",
        json={**payload, "email": "free@example.com", "login": "taken"},
    )

    assert same_email.status_code == status.HTTP_409_CONFLICT
    assert same_login.status_code == status.HTTP_409_CONFLICT


def test_reset_password_rejects_bad_tokens(client: TestClient, db: Session) -> None:
    user = create_user(db, email="reset@volunteer.com")
    access_token = create_access_token({"sub": user.email})
    expired_reset_token = jwt.encode(
        {
            "sub": user.email,
            "exp": datetime.now(UTC) - timedelta(seconds=1),
            "type": "reset",
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    for token in ("garbage", access_token, expired_reset_token):
        response = client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "new-password"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST, token

    login = client.post(
        "/api/v1/token", data={"username": user.email, "password": "new-password"}
    )
    assert login.status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_token_returns_a_new_pair(client: TestClient, db: Session) -> None:
    user = create_user(db, email="refresh@volunteer.com")
    login = client.post(
        "/api/v1/token", data={"username": user.email, "password": "password"}
    ).json()

    response = client.post(
        "/api/v1/token/refresh", json={"refreshToken": login["refreshToken"]}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["tokenType"] == "bearer"
    me = client.get(
        "/api/v1/me", headers={"Authorization": f"Bearer {data['accessToken']}"}
    )
    assert me.json()["email"] == user.email


def test_refresh_token_rejects_invalid_or_access_tokens(
    client: TestClient, db: Session
) -> None:
    user = create_user(db, email="refresh@volunteer.com")
    login = client.post(
        "/api/v1/token", data={"username": user.email, "password": "password"}
    ).json()

    for token in ("garbage", login["accessToken"]):
        response = client.post("/api/v1/token/refresh", json={"refreshToken": token})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED, token
