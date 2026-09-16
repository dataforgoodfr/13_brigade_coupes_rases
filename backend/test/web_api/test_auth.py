from unittest.mock import patch

from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from test.common.user import create_user


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
