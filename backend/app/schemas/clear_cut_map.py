import datetime
from logging import getLogger
from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, Field, ConfigDict

from app.models import ClearCutReport
from app.schemas.tag import TAGS


logger = getLogger(__name__)


class ClearCutReportPreviewSchema(BaseModel):
    id: str = Field(json_schema_extra={"example": "1"})
    location: Point
    boundary: MultiPolygon
    tags_ids: list[str] = Field(
        json_schema_extra={"example": "[1,2,3]"},
    )
    status: str = Field(
        json_schema_extra={"example": "validated"},
    )
    ecological_zoning_ids: list[str]
    cities: set[str]
    model_config = ConfigDict(from_attributes=True)


def clearcut_to_preview_schema(report: ClearCutReport) -> ClearCutReportPreviewSchema:
    return ClearCutReportPreviewSchema(
        id=str(report.id),
        boundary=MultiPolygon.model_validate_json(report.boundary),
        location=Point.model_validate_json(report.location),
        tags_ids=[tag for tag in TAGS],
        status=report.status,
        slope_area_ratio_percentage=report.slope_area_ratio_percentage,
        area_hectare=report.area_hectare,
        created_at=report.created_at,
        cities={registry.city.name for registry in report.registries},
        cut_date=report.cut_date.date(),
        ecological_zoning_ids=[
            str(ecological_zoning.id) for ecological_zoning in report.ecological_zonings
        ],
    )


class ClearCutMapResponseSchema(BaseModel):
    points: list[Point]
    previews: list[ClearCutReportPreviewSchema]

    model_config = ConfigDict(from_attributes=True)
