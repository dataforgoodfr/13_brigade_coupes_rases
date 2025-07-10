from pydantic import BaseModel, ConfigDict, Field


class AreaRangeResponseSchema(BaseModel):
    min: int = Field(json_schema_extra={"example": 0.5})
    max: int = Field(json_schema_extra={"example": 10})


class FiltersResponseSchema(BaseModel):
    area_range: AreaRangeResponseSchema

    cut_years: list[int] = Field(
        json_schema_extra={"example": [2020, 2021, 2022, 2023]},
    )

    departments_ids: list[str] = Field(
        json_schema_extra={"example": ["1", "2", "3"]},
    )

    ecological_zoning: bool | None = Field(
        json_schema_extra={"example": False},
    )

    excessive_slop: bool | None = Field(
        json_schema_extra={"example": False},
    )

    statuses: list[str] = Field(
        json_schema_extra={"example": ["pending", "validated"]},
    )

    model_config = ConfigDict(from_attributes=True)
