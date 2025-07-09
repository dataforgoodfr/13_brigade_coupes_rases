from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User
from app.services.get_password_hash import get_password_hash


def new_user(
    role: str = "volunteer",
    password: str = "password",
    email: str = "houba.houba@marsupilami.com",
    login="HoubaHouba",
):
    return User(
        firstname="Houba",
        lastname="Houba",
        login=login,
        email=email,
        role=role,
        password=get_password_hash(password),
    )


def get_user_token(client: TestClient, db: Session, role: str):
    user = new_user(role=role)
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


def get_admin_user_token(client: TestClient, db: Session):
    return get_user_token(client, db, "admin")


def get_volunteer_user_token(client: TestClient, db: Session):
    return get_user_token(client, db, "volunteer")
