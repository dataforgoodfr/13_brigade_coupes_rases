import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Department, User
from test.common.user import (
    create_user,
    get_admin_user_token,
    get_volunteer_user_token,
    new_user,
)


def test_create_user(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    userJson = {
        "first_name": "John",
        "last_name": "Tree",
        "login": "JohnTree78",
        "email": "john.tree2@yahoo.com",
        "password": "password",
        "role": "volunteer",
    }
    response = client.post(
        "/api/v1/users/", json=userJson, headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = client.get(
        response.headers["location"], headers={"Authorization": f"Bearer {token}"}
    ).json()

    assert data["id"] is not None
    assert data["createdAt"] is not None
    assert data["updatedAt"] is not None


def test_create_user_without_admin_right_should_return_forbidden(
    client: TestClient, db: Session
) -> None:
    token = get_volunteer_user_token(client, db)[1]
    userJson = {
        "first_name": "John",
        "last_name": "Tree",
        "login": "JohnTree78",
        "email": "john.tree2@yahoo.com",
        "password": "password",
        "role": "volunteer",
    }
    response = client.post(
        "/api/v1/users/", json=userJson, headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


def test_get_user(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    user = new_user(email="target@volunteer.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    response = client.get(
        f"/api/v1/users/{user.id}", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] is not None
    assert data["createdAt"] is not None
    assert data["updatedAt"] is not None


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_user_routes_require_a_token(
    client: TestClient, db: Session, method: str
) -> None:
    user = create_user(db, email="target@volunteer.com")

    response = client.request(
        method, f"/api/v1/users/{user.id}", json={"role": "admin"}
    )

    assert response.status_code == 401


@pytest.mark.parametrize("method", ["get", "put", "delete"])
def test_user_routes_are_forbidden_to_volunteers(
    client: TestClient, db: Session, method: str
) -> None:
    token = get_volunteer_user_token(client, db)[1]
    target_id = create_user(db, email="target@volunteer.com").id

    response = client.request(
        method,
        f"/api/v1/users/{target_id}",
        json={"role": "admin"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
    target = db.get(User, target_id)
    assert target is not None
    assert target.role == "volunteer"
    assert target.deleted_at is None


def test_admin_can_delete_a_user(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    target_id = create_user(db, email="target@volunteer.com").id

    response = client.delete(
        f"/api/v1/users/{target_id}", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 204
    target = db.get(User, target_id)
    assert target is not None
    assert target.deleted_at is not None


def test_update_user(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    headers = {"Authorization": f"Bearer {token}"}
    user = new_user(email="target@volunteer.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    # Update first_name
    update_response = client.put(
        f"/api/v1/users/{user.id}",
        json={
            "firstName": "Sorenza",
        },
        headers=headers,
    )
    assert update_response.status_code == 204

    # Check updated datas
    get_response = client.get(f"/api/v1/users/{user.id}", headers=headers)
    assert get_response.status_code == 200
    data = get_response.json()

    assert data["firstName"] == "Sorenza"


def test_get_users(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    user = new_user(login="ABC", email="ABC@ABC.com")

    department = Department(code="75", name="Paris")
    user.departments.append(department)
    db.add_all([user, department])
    db.commit()
    db.refresh(user)

    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    data = response.json()
    # 5 seeded users + the admin created for the token + the "ABC" user above.
    assert len(data["content"]) == 7
    assert data["content"][-1]["id"] == str(user.id)


def test_login_user(client: TestClient, db: Session) -> None:
    user = new_user(email="houba.houba@marsupilami.com")
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/token",
        data={
            "username": "houba.houba@marsupilami.com",
            "password": "password",
        },
    )
    assert response.status_code == 200

    data = response.json()
    assert data["accessToken"] is not None
    assert data["tokenType"] == "bearer"


def test_login_user_not_found_should_return_unauthorized(client: TestClient) -> None:
    response = client.post(
        "/api/v1/token",
        data={
            "username": "houba.houba@marsupilami.com",
            "password": "password",
        },
    )
    assert response.status_code == 401


def test_get_me(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    response = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == "houba.houba@marsupilami.com"


def test_put_me_replaces_favorites(client: TestClient, db: Session) -> None:
    token = get_volunteer_user_token(client, db)[1]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.put("/api/v1/me", json={"favorites": ["1", "2"]}, headers=headers)
    assert response.status_code == 204
    assert client.get("/api/v1/me", headers=headers).json()["favorites"] == ["1", "2"]

    response = client.put("/api/v1/me", json={"favorites": ["3"]}, headers=headers)
    assert response.status_code == 204
    assert client.get("/api/v1/me", headers=headers).json()["favorites"] == ["3"]


def test_me_requires_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/me").status_code == 401
    assert client.put("/api/v1/me", json={"favorites": []}).status_code == 401


def test_get_users_filters_and_sorts(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    headers = {"Authorization": f"Bearer {token}"}
    department = Department(code="48", name="Lozère")
    zoe = new_user(login="zoe", email="zoe@example.com")
    zoe.first_name = "Zoé"
    zoe.departments.append(department)
    yann = new_user(login="yann", email="yann@example.com", role="admin")
    yann.last_name = "Yannick"
    db.add_all([department, zoe, yann])
    db.commit()

    def emails(**params: str | list[str]) -> list[str]:
        response = client.get("/api/v1/users", params=params, headers=headers)
        assert response.status_code == 200
        return [user["email"] for user in response.json()["content"]]

    assert emails(email="zoe") == ["zoe@example.com"]
    assert emails(login="YANN") == ["yann@example.com"]
    assert emails(firstName="zo") == ["zoe@example.com"]
    assert emails(lastName="yannick") == ["yann@example.com"]
    assert set(emails(roles=["admin"])) >= {"yann@example.com"}
    assert "zoe@example.com" not in emails(roles=["admin"])
    assert emails(departmentsIds=[str(department.id)]) == ["zoe@example.com"]
    assert emails(descSort=["email"])[0] == "zoe@example.com"
    assert emails(ascSort=["email"])[-1] == "zoe@example.com"


def test_get_users_paginates(client: TestClient, db: Session) -> None:
    token = get_admin_user_token(client, db)[1]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/users", params={"size": 2}, headers=headers)

    data = response.json()
    assert len(data["content"]) == 2
    assert data["metadata"]["size"] == 2
    assert data["metadata"]["totalCount"] >= 3
    assert "next" in data["metadata"]["links"]
