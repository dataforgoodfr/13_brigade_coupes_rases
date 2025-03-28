from pydantic import BaseModel, Field

from app.models import City
from app.schemas.department import DepartmentBase, department_to_department_base


class CreateCity(BaseModel):
    name: str = Field(json_schema_extra={"example": "Paris"})
    zip_code: str = Field(json_schema_extra={"example": "75000"})
    department_id: str = Field(json_schema_extra={"example": "1"})


class CityResponse(BaseModel):
    id: str
    name: str = Field(json_schema_extra={"example": "Paris"})
    zip_code: str = Field(json_schema_extra={"example": "75000"})
    department: DepartmentBase


class CityPreview(BaseModel):
    id: str
    name: str = Field(json_schema_extra={"example": "Paris"})
    zip_code: str = Field(json_schema_extra={"example": "75000"})
    department_id: str


def city_to_preview(city: City) -> CityPreview:
    return CityPreview(
        id=str(city.id),
        name=city.name,
        zip_code=city.zip_code,
        department_id=str(city.department_id),
    )


def city_to_response(city: City) -> CityResponse:
    return CityResponse(
        id=str(city.id),
        name=city.name,
        zip_code=city.zip_code,
        department=department_to_department_base(city.department),
    )
