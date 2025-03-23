from fastapi.testclient import TestClient
from pytest import Session
from app.models import User
from app.services.user_auth import get_password_hash


def new_user(role: str = "volunteer", password: str = "password"):
    return User(
        firstname="Houba",
        lastname="Houba",
        email="houba.houba@marsupilami.com",
        role=role,
        password=get_password_hash(password),
    )


def get_admin_user_token(client: TestClient, db: Session):
    user = new_user(role="admin")
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/token",
        data={
            "username": "houba.houba@marsupilami.com",
            "password": "password",
        },
    )
    data = response.json()
    return data["access_token"]
