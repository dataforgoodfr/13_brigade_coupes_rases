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
