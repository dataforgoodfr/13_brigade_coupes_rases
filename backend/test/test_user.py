def test_create_user(client):
    userJson = {
    "firstname": "John",
    "lastname": "Tree",
    "email": "john.tree2@yahoo.com",
    "role": "viewer"
    }
    response = client.post(
        "/user/", json=userJson
    )

    assert response.status_code == 201
    data = response.json()

    assert data["id"] is not None
    assert data["created_at"] is not None
    assert data["updated_at"] is not None
    assert data["deleted_at"] is None

def test_get_user(client):
    response = client.get("/user/1")

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

def test_update_user(client):
    # New user
    create_response = client.post(
        "/user/", json={
            "firstname": "Jane",
            "lastname": "Doe",
            "email": "jane.doe@example.com",
            "role": "volunteer"
        }
    )
    assert create_response.status_code == 201
    user_id = create_response.json()["id"]

    # Update role
    update_response = client.put(
        f"/user/{user_id}", json={
            "firstname": "Jane",
            "lastname": "Smith",
            "email": "jane.smith@example.com",
            "role": "admin"
        }
    )
    assert update_response.status_code == 200

    # Check updated datas
    get_response = client.get(f"/user/{user_id}")
    assert get_response.status_code == 200
    data = get_response.json()
    assert data["email"] == "jane.smith@example.com"
    assert data["role"] == "admin"

def test_get_users(client):
    response = client.get("/user")
    assert response.status_code == 200

    data = response.json()
    assert len(data) >= 2