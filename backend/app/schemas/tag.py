from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

TAG_TYPES = ["excessive_slop", "excessive_area", "ecological_zoning"]


class Tag(BaseModel):
    type: str = Field(json_schema_extra={"example": "excessive_slop"})
    value: Optional[float] = Field(
        default=None, json_schema_extra={"example": "42"}
    )

    @field_validator("type")
    def validate_type(cls, value: str) -> str:
        if value is not None and value not in TAG_TYPES:
            raise ValueError(f"Type must be one of : {', '.join(TAG_TYPES)}")
        return value

    model_config = ConfigDict(from_attributes=True)


TAGS = {
    "1": Tag(type="excessive_slop", value=42),
    "2": Tag(type="excessive_area", value=42),
    "3": Tag(type="ecological_zoning"),
}
