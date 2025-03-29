from datetime import date, datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import CLEARCUT_STATUSES, ClearCut
from app.schemas.ecological_zoning import EcologicalZoningSchema
from app.schemas.registry import CreateRegistrySchema

logger = getLogger(__name__)


class ClearCutCreateSchema(BaseModel):
    ecological_zonings: list[EcologicalZoningSchema] = Field(default=[])
    slope_percentage: float = Field(json_schema_extra={"example": "10"})
    area_hectare: float = Field(json_schema_extra={"example": "10"})
    cut_date: datetime
    location: Point
    boundary: MultiPolygon
    registries: list[CreateRegistrySchema]


class ClearCutBaseSchema(BaseModel):
    slope_percentage: float
    area_hectare: float
    cut_date: date


class ClearCutPatch(BaseModel):
    status: Optional[str] = None
    user_id: Optional[int] = None

    @field_validator("status")
    def validate_status(cls, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError("Status must be one of: pending, validated")
        return value


class ClearCutResponseSchema(BaseModel):
    id: str
    area_hectare: float
    slope_percentage: float
    cut_date: datetime
    status: str
    user_id: Optional[str]
    ecological_zonings_ids: list[str]
    created_at: datetime
    updated_at: datetime
    user_id: Optional[str]
    location: Point
    boundary: MultiPolygon
    registries_ids: list[str]
    model_config = ConfigDict(from_attributes=True)


def clearcut_to_response_schema(clearcut: ClearCut) -> ClearCutResponseSchema:
    return ClearCutResponseSchema(
        id=str(clearcut.id),
        boundary=MultiPolygon.model_validate_json(clearcut.boundary),
        location=Point.model_validate_json(clearcut.location),
        ecological_zonings_ids=[
            str(ecological_zoning.id) for ecological_zoning in clearcut.ecological_zonings
        ],
        registries_ids=[str(registry.id) for registry in clearcut.registries],
        created_at=clearcut.created_at,
        cut_date=clearcut.cut_date,
        status=clearcut.status,
        slope_percentage=clearcut.slope_percentage,
        area_hectare=clearcut.area_hectare,
        updated_at=clearcut.updated_at,
        user_id=clearcut.user_id and str(clearcut.user_id),
    )
