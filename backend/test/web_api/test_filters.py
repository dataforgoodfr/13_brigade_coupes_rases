from fastapi import status
from fastapi.testclient import TestClient


def test_get_filters(client: TestClient):
    response = client.get("api/v1/filters")
    assert response.status_code == status.HTTP_200_OK
