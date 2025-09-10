from pydantic import Field

from app.schemas.base import BaseSchema


class AreaRangeResponseSchema(BaseSchema):
    min: int = Field(json_schema_extra={"example": 0.5})
    max: int = Field(json_schema_extra={"example": 10})


class FiltersResponseSchema(BaseSchema):
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
