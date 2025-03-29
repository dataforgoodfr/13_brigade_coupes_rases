from fastapi.testclient import TestClient


def test_find_departments(client: TestClient):
    data = client.get("/api/v1/departments").json()
    assert len(data["content"]) == 10
