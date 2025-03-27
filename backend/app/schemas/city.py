from pydantic import BaseModel, Field


class City(BaseModel):
    name: str = Field(json_schema_extra={"example": "Paris"})
    zip_code: str = Field(json_schema_extra={"example": "75000"})
    department_id: int = Field(json_schema_extra={"example": "1"})
