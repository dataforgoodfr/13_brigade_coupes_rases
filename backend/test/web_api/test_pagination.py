import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.deps import MAX_PAGE_SIZE
from app.main import app
from test.common.user import get_admin_user_token


def test_every_paginated_route_bounds_its_page_size() -> None:
    size_params = [
        (path, param["schema"])
        for path, operations in app.openapi()["paths"].items()
        for operation in operations.values()
        for param in operation.get("parameters", [])
        if param["name"] == "size"
    ]
    assert len(size_params) >= 8
    for path, schema in size_params:
        assert schema.get("maximum") == MAX_PAGE_SIZE, path


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/users/",
        "/api/v1/clear-cuts/",
        "/api/v1/clear-cuts-reports/",
        "/api/v1/departments/",
        "/api/v1/ecological-zonings/",
    ],
)
def test_page_size_is_capped(client: TestClient, db: Session, path: str) -> None:
    _, token = get_admin_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    assert client.get(path, params={"size": MAX_PAGE_SIZE}, headers=headers).is_success
    for params in ({"size": 1_000_000}, {"size": 0}, {"page": -1}):
        response = client.get(path, params=params, headers=headers)
        assert response.status_code == 422, params
