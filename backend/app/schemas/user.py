from datetime import datetime
from logging import getLogger

from pydantic import Field

from app.models import User
from app.schemas.base import BaseSchema

from .shared import UserBaseSchema

logger = getLogger(__name__)


class UserUpdateSchema(UserBaseSchema):
    departments: list[str] = Field(
        default_factory=list, json_schema_extra={"example": ["1"]}
    )


class UserResponseSchema(UserBaseSchema):
    id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    departments: list[str]


class MeResponseSchema(UserResponseSchema):
    id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    departments: list[str]
    favorites: list[str]


class MeUpdateSchema(BaseSchema):
    favorites: list[str]


def user_to_user_response_schema(user: User) -> UserResponseSchema:
    return UserResponseSchema(
        id=str(user.id),
        deleted_at=user.deleted_at,
        created_at=user.created_at,
        role=user.role,
        updated_at=user.updated_at,
        first_name=user.first_name,
        last_name=user.last_name,
        login=user.login,
        email=user.email,
        departments=[str(department.id) for department in user.departments],
    )


def user_to_me_response_schema(user: User) -> MeResponseSchema:
    return MeResponseSchema(
        id=str(user.id),
        deleted_at=user.deleted_at,
        created_at=user.created_at,
        role=user.role,
        updated_at=user.updated_at,
        first_name=user.first_name,
        last_name=user.last_name,
        login=user.login,
        email=user.email,
        departments=[str(department.id) for department in user.departments],
        favorites=[str(favorite.id) for favorite in user.favorites],
    )
