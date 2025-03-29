from logging import getLogger

from pydantic import BaseModel, ConfigDict, Field

from app.models import Department

logger = getLogger(__name__)


class DepartmentBaseSchema(BaseModel):
    id: str
    code: str = Field(json_schema_extra={"example": "01"})
    name: str = Field(json_schema_extra={"example": "Ain"})
    model_config = ConfigDict(from_attributes=True)


def department_to_department_base_schema(
    department: Department,
) -> DepartmentBaseSchema:
    return DepartmentBaseSchema(
        id=str(department.id), code=department.code, name=department.name
    )


class DepartmentResponseSchema(DepartmentBaseSchema):
    users_ids: list[str]


def department_to_department_base_response_schema(
    department: Department,
) -> DepartmentBaseSchema:
    return DepartmentResponseSchema(
        id=str(department.id),
        code=department.code,
        name=department.name,
        users_ids=[str(user.id) for user in department.users],
    )
