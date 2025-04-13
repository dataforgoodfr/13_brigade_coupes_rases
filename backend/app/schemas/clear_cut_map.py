import datetime
from logging import getLogger
from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, Field, ConfigDict

from app.models import ClearCutReport
from app.schemas.tag import TAGS


logger = getLogger(__name__)


class ClearCutPreviewSchema(BaseModel):
    id: str = Field(json_schema_extra={"example": "1"})
    location: Point
    boundary: MultiPolygon
    observation_start_date: datetime.date = Field(
        json_schema_extra={"example": "2023-10-10"},
    )
    observation_end_date: datetime.date = Field(
        json_schema_extra={"example": "2023-10-01"},
    )
    area_hectare: float = Field(
        json_schema_extra={"example": 10.0},
    )
    ecological_zoning_ids: list[str] = Field(
        json_schema_extra={"example": "[1,2,3]"},
    )

    model_config = ConfigDict(from_attributes=True)


class ClearCutReportPreviewSchema(BaseModel):
    id: str = Field(json_schema_extra={"example": "1"})
    clear_cuts: list[ClearCutPreviewSchema]
    created_at: datetime.date = Field(
        json_schema_extra={"example": "2023-10-10"},
    )
    updated_at: datetime.date = Field(
        json_schema_extra={"example": "2023-10-01"},
    )
    tags_ids: list[str] = Field(
        json_schema_extra={"example": "[1,2,3]"},
    )
    total_area_hectare: float = Field(
        json_schema_extra={"example": 10.0},
    )
    average_location: Point
    status: str = Field(
        json_schema_extra={"example": "validated"},
    )
    city: str = (
        Field(
            json_schema_extra={"example": "Paris"},
        ),
    )
    department_id: str = Field(
        json_schema_extra={"example": "1"},
    )
    last_cut_date: datetime.date = Field(
        json_schema_extra={"example": "2023-10-01"},
    )
    slope_area_ratio_percentage: float = Field(
        json_schema_extra={"example": 10.0},
    )
    model_config = ConfigDict(from_attributes=True)


def row_to_report_preview_schema(
    row: tuple[Point, ClearCutReport],
) -> ClearCutReportPreviewSchema:
    [
        point,
        report,
        report_id,
        area_hectare,
        observation_start_date,
        observation_end_date,
        last_update,
        ecological_zonings_count,
        clear_cuts_ecological_zoning_count,
        average_location,
    ] = row
    return ClearCutReportPreviewSchema(
        id=str(report.id),
        clear_cuts=[
            ClearCutPreviewSchema(
                id=str(clear_cut.id),
                area_hectare=clear_cut.area_hectare,
                boundary=MultiPolygon.model_validate_json(clear_cut.boundary_json),
                observation_start_date=clear_cut.observation_start_date.date(),
                observation_end_date=clear_cut.observation_end_date.date(),
                ecological_zoning_ids=[
                    str(ecological_zoning.ecological_zoning_id)
                    for ecological_zoning in clear_cut.ecological_zonings
                ],
                location=Point.model_validate_json(clear_cut.location_json),
            )
            for clear_cut in report.clear_cuts
        ],
        department_id=str(report.city.department.id),
        average_location=Point.model_validate_json(point),
        tags_ids=[tag for tag in TAGS],
        status=report.status,
        slope_area_ratio_percentage=report.slope_area_ratio_percentage,
        created_at=report.created_at.date(),
        updated_at=report.updated_at.date(),
        city=report.city.name,
        total_area_hectare=sum(clear_cut.area_hectare for clear_cut in report.clear_cuts),
        last_cut_date=max(
            clear_cut.observation_end_date for clear_cut in report.clear_cuts
        ).date(),
    )


class ClearCutMapResponseSchema(BaseModel):
    points: list[Point]
    previews: list[ClearCutReportPreviewSchema]

    model_config = ConfigDict(from_attributes=True)
