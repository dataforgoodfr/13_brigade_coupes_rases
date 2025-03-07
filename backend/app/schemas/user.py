from datetime import datetime
from logging import getLogger
from app.schemas.department import DepartmentBase
from pydantic import Field
from .shared import UserBase

logger = getLogger(__name__)

# Schéma pour la création d'une nouvelle instance de ClearCut
class UserCreate(UserBase):
    departments: list[int] = Field(
        default_factory=list,
        example=[1])


class UserUpdate(UserCreate):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    departments: list[DepartmentBase]
