from datetime import date, datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import CLEARCUT_STATUSES, ClearCutReport
from app.schemas.clear_cut import ClearCutCreateSchema
from app.schemas.ecological_zoning import EcologicalZoningSchema
from app.schemas.registry import CreateRegistrySchema

logger = getLogger(__name__)


class CreateClearCutsReportCreateSchema(BaseModel):
    slope_area_ratio_percentage: float = Field(json_schema_extra={"example": "10"})
    clear_cuts: list[ClearCutCreateSchema]


class ClearCutReportPatchSchema(BaseModel):
    status: Optional[str] = None
    user_id: Optional[int] = None

    @field_validator("status")
    def validate_status(cls, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError("Status must be one of: pending, validated")
        return value


class ClearCutReportResponseSchema(BaseModel):
    id: str
    slope_area_ratio_percentage: float
    status: str
    user_id: Optional[str]
    clear_cuts_ids: list[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


def report_to_response_schema(report: ClearCutReport) -> ClearCutReportResponseSchema:
    return ClearCutReportResponseSchema(
        id=str(report.id),
        clear_cuts_ids=[str(clearcut.id) for clearcut in report.clear_cuts],
        created_at=report.created_at,
        status=report.status,
        slope_area_ratio_percentage=report.slope_area_ratio_percentage,
        updated_at=report.updated_at,
        user_id=report.user_id and str(report.user_id),
    )
