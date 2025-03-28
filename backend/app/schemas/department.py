from logging import getLogger

from pydantic import BaseModel, ConfigDict

from app.models import Department
from app.schemas.shared import UserBase

logger = getLogger(__name__)


class DepartmentBase(BaseModel):
    id: str
    code: str
    name: str
    model_config = ConfigDict(from_attributes=True)


def department_to_department_base(department: Department) -> DepartmentBase:
    return DepartmentBase(id=str(department.id), code=department.code, name=department.name)


class DepartmentResponse(DepartmentBase):
    users: list[UserBase]
