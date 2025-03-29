from pydantic import BaseModel, Field


class CreateRegistrySchema(BaseModel):
    number: str = Field(json_schema_extra={"example": "0089"})
    sheet: int = Field(json_schema_extra={"example": "1"})
    section: str = Field(json_schema_extra={"example": "0H"})
    zip_code: str = Field(json_schema_extra={"example": "13055"})
    district_code: str = Field(json_schema_extra={"example": "125"})
