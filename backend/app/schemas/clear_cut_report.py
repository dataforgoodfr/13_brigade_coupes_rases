from datetime import date, datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import CLEARCUT_STATUSES, ClearCutReport
from app.schemas.clear_cut import ClearCutCreateSchema
from app.schemas.ecological_zoning import EcologicalZoningSchema

logger = getLogger(__name__)


class CreateClearCutsReportCreateSchema(BaseModel):
    slope_area_ratio_percentage: float = Field(json_schema_extra={"example": "10"})
    clear_cuts: list[ClearCutCreateSchema]
    city_zip_code: str = Field(
        json_schema_extra={"example": "1"},
    )


class ClearCutReportPatchSchema(BaseModel):
    status: Optional[str] = None
    user_id: Optional[int] = None

    @field_validator("status")
    def validate_status(cls, value):
        if value not in CLEARCUT_STATUSES:
            raise ValueError("Status must be one of: pending, validated")
        return value


class ClearCutReportResponseSchema(BaseModel):
    id: str = Field(json_schema_extra={"example": "1"})
    slope_area_ratio_percentage: float = Field(
        json_schema_extra={"example": "10"},
    )
    status: str = Field(
        json_schema_extra={"example": "validated"},
    )
    user_id: Optional[str] = Field(
        json_schema_extra={"example": "1"},
    )
    clear_cuts_ids: list[str] = Field(
        json_schema_extra={"example": "[1,2,3]"},
    )
    created_at: datetime = Field(
        json_schema_extra={"example": "2023-10-10T00:00:00Z"},
    )
    updated_at: datetime = Field(
        json_schema_extra={"example": "2023-10-10T00:00:00Z"},
    )
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
        city_id= str(report.city_id)
    )
