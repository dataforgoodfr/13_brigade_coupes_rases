from fastapi.testclient import TestClient

from . import ensure_authentication

def test_endpoint_authentication(client: TestClient):
    ensure_authentication(client, "post", "/imports/clearcuts")
    ensure_authentication(client, "put", "/imports/clearcut/42")
