from datetime import datetime
from logging import getLogger

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema

from .shared import UserBaseSchema

logger = getLogger(__name__)


class UserUpdateSchema(UserBaseSchema):
    departments: list[int] = Field(
        default_factory=list, json_schema_extra={"example": [1]}
    )


class UserCreateSchema(UserUpdateSchema):
    # TODO: this should probably not be here
    password: str = Field(json_schema_extra={"example": "strongpassword123"})

class UserResponseSchema(UserBaseSchema):
    id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    departments: list[str]

