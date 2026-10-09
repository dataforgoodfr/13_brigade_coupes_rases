from unittest.mock import MagicMock, patch

from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User
from test.common.user import get_admin_user_token, new_user

USERS = "/api/v1/users/"


def admin_headers(client: TestClient, db: Session) -> dict[str, str]:
    return {"Authorization": f"Bearer {get_admin_user_token(client, db)[1]}"}


def create_account(
    client: TestClient, headers: dict[str, str], **fields: object
) -> tuple[int, MagicMock]:
    body = {
        "firstName": "Anna",
        "lastName": "Chêne",
        "login": "anna",
        "email": "anna@benevoles.org",
        "role": "volunteer",
        "isActive": True,
        **fields,
    }
    with patch("app.routes.users.send_activation_email") as send_mail:
        response = client.post(USERS, json=body, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED, response.json()
    return int(response.headers["location"].rsplit("/", 1)[1]), send_mail


def login(client: TestClient, email: str, password: str) -> int:
    response = client.post(
        "/api/v1/token", data={"username": email, "password": password}
    )
    return int(response.status_code)


def test_admin_created_account_is_activated_from_the_email(
    client: TestClient, db: Session
) -> None:
    _, send_mail = create_account(client, admin_headers(client, db))

    send_mail.assert_called_once()
    email, user_login, token = send_mail.call_args.args
    assert (email, user_login) == ("anna@benevoles.org", "anna")

    response = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "mon-mot-de-passe"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert login(client, email, "mon-mot-de-passe") == status.HTTP_200_OK


def test_admin_created_account_keeps_the_active_switch(
    client: TestClient, db: Session
) -> None:
    user_id, send_mail = create_account(
        client, admin_headers(client, db), isActive=False
    )

    user = db.get(User, user_id)
    assert user is not None and user.is_active is False
    client.post(
        "/api/v1/auth/reset-password",
        json={"token": send_mail.call_args.args[2], "new_password": "mdp-choisi"},
    )
    response = client.post(
        "/api/v1/token",
        data={"username": "anna@benevoles.org", "password": "mdp-choisi"},
    )
    assert response.json()["detail"]["type"] == "USER_INACTIVE"


def test_login_already_taken_is_refused(client: TestClient, db: Session) -> None:
    headers = admin_headers(client, db)
    create_account(client, headers)

    with patch("app.routes.users.send_activation_email") as send_mail:
        response = client.post(
            USERS,
            json={"login": "anna", "email": "autre@benevoles.org", "role": "volunteer"},
            headers=headers,
        )

    assert response.status_code == status.HTTP_409_CONFLICT
    send_mail.assert_not_called()


def test_activating_a_registered_account_notifies_the_volunteer(
    client: TestClient, db: Session
) -> None:
    user = new_user(email="inscrit@benevoles.org")
    user.is_active = False
    db.add(user)
    db.commit()
    url = f"{USERS}{user.id}"
    headers = admin_headers(client, db)

    with patch("app.services.user.send_account_activated_email") as send_mail:
        client.put(url, json={"firstName": "Renamed"}, headers=headers)
        send_mail.assert_not_called()

        client.put(url, json={"isActive": True}, headers=headers)
        send_mail.assert_called_once_with("inscrit@benevoles.org")

        client.put(url, json={"isActive": True}, headers=headers)
        send_mail.assert_called_once()


def test_admin_recreates_a_deleted_account(client: TestClient, db: Session) -> None:
    headers = admin_headers(client, db)
    user_id, _ = create_account(client, headers)
    client.delete(f"{USERS}{user_id}", headers=headers)

    recreated_id, send_mail = create_account(client, headers)

    send_mail.assert_called_once()
    assert recreated_id == user_id
    response = client.get(f"{USERS}{user_id}", headers=headers)
    assert response.status_code == status.HTTP_200_OK
