from fastapi.testclient import TestClient
from fastapi import status


def test_get_filters(client: TestClient):
    response = client.get("api/v1/filters")
    assert response.status_code == status.HTTP_200_OK
