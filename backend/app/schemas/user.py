from datetime import datetime
from logging import getLogger
from app.schemas.department import DepartmentBase
from pydantic import BaseModel, EmailStr, Field
from .shared import UserBase

logger = getLogger(__name__)


# Schema for creating a new User instance
class UserCreate(UserBase):
    departments: list[int] = Field(
        default_factory=list, json_schema_extra={"example": [1]}
    )


class UserLogin(BaseModel):
    email: EmailStr = Field(
        default_factory=EmailStr, json_schema_extra={"example": "john.tree@canope.com"}
    )
    password: str = Field(
        default_factory=str, json_schema_extra={"example": "password"}
    )


class UserUpdate(UserCreate):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    departments: list[DepartmentBase]
