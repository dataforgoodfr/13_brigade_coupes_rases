from pydantic import BaseModel, Field

from app.models import City
from app.schemas.department import DepartmentBaseSchema

class CitySchema(BaseModel):
    id: str
    name: str = Field(json_schema_extra={"example": "Paris"})
    zip_code: str = Field(json_schema_extra={"example": "75000"})
    department: DepartmentBaseSchema


class CityPreviewSchema(BaseModel):
    name: str = Field(json_schema_extra={"example": "Paris"})
    zip_code: str = Field(json_schema_extra={"example": "75000"})
    department_id: str


def city_to_preview_schema(city: City) -> CityPreviewSchema:
    return CityPreviewSchema(
        name=city.name,
        zip_code=city.zip_code,
        department_id=str(city.department_id),
    )


def cities_to_preview_schemas(cities: list[City]) -> dict[str, CityPreviewSchema]:
    return {str(city.id): city_to_preview_schema(city) for city in cities}


