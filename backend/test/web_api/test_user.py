from fastapi.testclient import TestClient
from pytest import Session
from app.models import Department
from common.user import get_admin_user_token, get_volunteer_user_token, new_user


def test_create_user(client: TestClient, db: Session):
    token = get_admin_user_token(client, db)
    userJson = {
        "firstname": "John",
        "lastname": "Tree",
        "login": "JohnTree78",
        "email": "john.tree2@yahoo.com",
        "role": "volunteer",
    }
    response = client.post(
        "/api/v1/users/", json=userJson, headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    assert data["deleted_at"] is None


def test_create_user_without_admin_right_should_return_forbidden(
    client: TestClient, db: Session
):
    token = get_volunteer_user_token(client, db)
    userJson = {
        "firstname": "John",
        "lastname": "Tree",
        "login": "JohnTree78",
        "email": "john.tree2@yahoo.com",
        "role": "volunteer",
    }
    response = client.post(
        "/api/v1/users/", json=userJson, headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


def test_get_user(client, db):
    user = new_user()
    db.add(user)
    db.commit()
    db.refresh(user)

    response = client.get(f"/api/v1/users/{user.id}")

    assert response.status_code == 200
    data = response.json()

    assert data["id"] is not None
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    assert data["deleted_at"] is None


# def test_create_invalid_user(client):
#     # TODO : Add test covering wrong email format and wrong role
#     assert True is True

# def test_delete_user(client):
#     # TODO : Add test covering user deletion
#     # Should not remove it but anonymise and at deleted_at
#     assert True is True


def test_update_user(client, db):
    user = new_user()
    db.add(user)
    db.commit()
    db.refresh(user)

    # Update role
    update_response = client.put(
        f"/api/v1/users/{user.id}",
        json={
            "role": "admin",
        },
    )
    assert update_response.status_code == 200

    # Check updated datas
    get_response = client.get(f"/api/v1/users/{user.id}")
    assert get_response.status_code == 200
    data = get_response.json()

    assert data["role"] == "admin"


def test_get_users(client, db):
    user = new_user()
    department = Department(code="75", name="Paris")
    user.departments.append(department)
    db.add_all([user, department])
    db.commit()
    db.refresh(user)

    response = client.get("/api/v1/users")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == user.id


def test_login_user(client, db):
    user = new_user()
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
    assert data["access_token"] is not None
    assert data["token_type"] == "bearer"


def test_login_user_not_found_should_return_unauthorized(client):
    response = client.post(
        "/api/v1/token",
        data={
            "username": "houba.houba@marsupilami.com",
            "password": "password",
        },
    )
    assert response.status_code == 401


def test_get_me(client, db):
    token = get_admin_user_token(client, db)
    response = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == "houba.houba@marsupilami.com"
