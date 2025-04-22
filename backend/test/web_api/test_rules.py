from common.user import get_admin_user_token
from fastapi import status
from fastapi.testclient import TestClient
from pytest import Session


def test_get_rules(client: TestClient):
    response = client.get("api/v1/rules/")
    assert response.status_code == status.HTTP_200_OK


def test_update_rules(client: TestClient, db: Session):
    token = get_admin_user_token(client, db)

    response = client.put(
        "api/v1/rules/1",
        json={"threshold": 42, "ecological_zonings_ids": ["1"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
