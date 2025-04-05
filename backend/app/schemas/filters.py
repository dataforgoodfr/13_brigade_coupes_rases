from pydantic import BaseModel, ConfigDict, Field


class FiltersResponseSchema(BaseModel):
    tags_ids: list[str] = Field(
        json_schema_extra={"example": ["1", "2", "3"]},
    )

    area_preset_hectare: list[float] = Field(
        json_schema_extra={"example": [0.5, 1, 2, 5, 10]},
    )

    cut_years: list[int] = Field(
        json_schema_extra={"example": [2020, 2021, 2022, 2023]},
    )

    departments_ids: list[str] = Field(
        json_schema_extra={"example": ["1", "2", "3"]},
    )

    ecological_zoning: bool = Field(
        json_schema_extra={"example": False},
    )

    excessive_slop: bool = Field(
        json_schema_extra={"example": False},
    )

    statuses: list[str] = Field(
        json_schema_extra={"example": ["pending", "validated"]},
    )

    model_config = ConfigDict(from_attributes=True)
