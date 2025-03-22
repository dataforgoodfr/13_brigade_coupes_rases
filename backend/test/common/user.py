from app.models import User


def new_user(role: str = "volunteer"):
    return User(
        firstname="Houba",
        lastname="Houba",
        email="houba.houba@marsupilami.com",
        role=role,
    )
