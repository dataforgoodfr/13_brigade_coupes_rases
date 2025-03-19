from fastapi.testclient import TestClient

def ensure_authentication(client: TestClient, verb: str, path: str):
    response = client.request(verb, path, headers={})
    assert response.status_code == 401

    response = client.request(verb, path, headers={"x-imports-token": "test-token"})
    assert response.status_code == 200
