from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from test.common.user import get_admin_user_token

USERS = "/api/v1/users/"


def search(client: TestClient, headers: dict[str, str], text: str) -> list[str]:
    response = client.get(USERS, params={"fullTextSearch": text}, headers=headers)
    assert response.status_code == 200
    return [user["login"] for user in response.json()["content"]]


def test_a_new_account_is_found_by_name_and_login(
    client: TestClient, db: Session
) -> None:
    headers = {"Authorization": f"Bearer {get_admin_user_token(client, db)[1]}"}
    with patch("app.routes.users.send_activation_email", create=True):
        response = client.post(
            USERS,
            json={
                "firstName": "Camille",
                "lastName": "Hêtre",
                "login": "camille-h",
                "email": "camille@benevoles.org",
                "role": "volunteer",
            },
            headers=headers,
        )
    assert response.status_code == 201

    assert search(client, headers, "camille-h") == ["camille-h"]
    assert search(client, headers, "camille hêtre") == ["camille-h"]
    assert search(client, headers, "HÊTRE") == ["camille-h"]
    assert search(client, headers, "camille chêne") == []


def test_a_renamed_account_is_found_under_its_new_name(
    client: TestClient, db: Session
) -> None:
    headers = {"Authorization": f"Bearer {get_admin_user_token(client, db)[1]}"}
    with patch("app.routes.users.send_activation_email", create=True):
        location = client.post(
            USERS,
            json={
                "login": "renomme",
                "email": "renomme@benevoles.org",
                "role": "volunteer",
            },
            headers=headers,
        ).headers["location"]

    client.put(
        location.replace("/api/v1/users/", USERS),
        json={"lastName": "Bouleau"},
        headers=headers,
    )

    assert search(client, headers, "bouleau") == ["renomme"]
