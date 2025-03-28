from datetime import date, datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, field_validator

from app.models import CLEARCUT_STATUSES, ClearCut
from app.schemas.city import CreateCity

logger = getLogger(__name__)


class ClearCutCreate(BaseModel):
    slope_percentage: float
    cut_date: datetime
    location: Point
    boundary: MultiPolygon
    natura_name: Optional[str]
    natura_code: Optional[str]
    city: CreateCity


class ClearCutBase(BaseModel):
    slope_percentage: float
    cut_date: date


class ClearCutPatch(BaseModel):
    status: Optional[str] = None
    user_id: Optional[int] = None

    @field_validator("status")
    def validate_status(cls, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError("Status must be one of: pending, validated")
        return value


class ClearCutResponse(BaseModel):
    id: str
    slope_percentage: float
    cut_date: datetime
    status: str
    user_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    user_id: Optional[str]
    city_id: str
    location: Point
    boundary: MultiPolygon
    model_config = ConfigDict(from_attributes=True)


def clearcut_to_response(clearcut: ClearCut) -> ClearCutResponse:
    return ClearCutResponse(
        id=str(clearcut.id),
        boundary=MultiPolygon.model_validate_json(clearcut.boundary),
        location=Point.model_validate_json(clearcut.location),
        created_at=clearcut.created_at,
        cut_date=clearcut.cut_date,
        status=clearcut.status,
        slope_percentage=clearcut.slope_percentage,
        updated_at=clearcut.updated_at,
        user_id=clearcut.user_id and str(clearcut.user_id),
        city_id=str(clearcut.city.id),
    )
