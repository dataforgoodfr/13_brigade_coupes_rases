from app.models import User, Department


def test_create_user(client):
    userJson = {
        "firstname": "John",
        "lastname": "Tree",
        "email": "john.tree2@yahoo.com",
        "role": "viewer",
    }
    response = client.post("/api/v1/users/", json=userJson)

    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    assert data["deleted_at"] is None


def test_get_user(client, db):
    user = User(
        firstname="Houba",
        lastname="Youba",
        email="houba.youba@marsupilami.com",
        role="volunteer",
    )
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
    user = User(
        firstname="Houba",
        lastname="Houba",
        email="houba.houba@marsupilami.com",
        role="volunteer",
    )
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
    user = User(
        firstname="Houba",
        lastname="Houba",
        email="houba.houba@marsupilami.com",
        role="volunteer",
    )
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
