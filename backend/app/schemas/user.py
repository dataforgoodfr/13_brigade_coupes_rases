from datetime import datetime
from logging import getLogger

from pydantic import Field

from .shared import UserBaseSchema

logger = getLogger(__name__)


# Schema for creating a new User instance
class UserCreateSchema(UserBaseSchema):
    departments: list[int] = Field(
        default_factory=list, json_schema_extra={"example": [1]}
    )


class UserUpdateSchema(UserCreateSchema):
    pass


class UserResponseSchema(UserBaseSchema):
    id: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    departments: list[str]
