from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import User
from app.services.get_password_hash import get_password_hash


def new_user(
    email: str = None,
    role: str = None,
    password: str = None,
    login=None,
):
    return User(
        firstname="Houba",
        lastname="Houba",
        login="HoubaHouba" if login is None else login,
        email="houba.houba@marsupilami.com" if email is None else email,
        role="volunteer" if role is None else role,
        password=get_password_hash("password" if password is None else password),
    )


def create_user(
    db: Session,
    email: str = None,
    role: str = None,
    password: str = None,
    login=None,
) -> User:
    user = new_user(role=role, email=email, password=password, login=login)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_token(
    client: TestClient, db: Session, role: str, email: str
) -> tuple[User, str]:
    email = email if email is not None else "houba.houba@marsupilami.com"
    user = create_user(db, role=role, email=email)

    response = client.post(
        "/api/v1/token",
        data={
            "username": email,
            "password": "password",
        },
    )
    data = response.json()
    return [user, data["accessToken"]]


def get_admin_user_token(
    client: TestClient, db: Session, email: str = None
) -> tuple[User, str]:
    return get_user_token(client, db, "admin", email=email)


def get_volunteer_user_token(
    client: TestClient, db: Session, email: str = None
) -> tuple[User, str]:
    return get_user_token(client, db, "volunteer", email=email)
