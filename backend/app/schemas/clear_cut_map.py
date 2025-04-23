import datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, Field

from app.models import ClearCut, ClearCutReport

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
    rules_ids: list[str] = Field(
        json_schema_extra={"example": "[1,2,3]"},
    )
    total_area_hectare: float = Field(
        json_schema_extra={"example": 10.0},
    )
    average_location: Point
    status: str = Field(
        json_schema_extra={"example": "validated"},
    )
    city: str = Field(
        json_schema_extra={"example": "Paris"},
    )
    department_id: str = Field(
        json_schema_extra={"example": "1"},
    )
    last_cut_date: datetime.date = Field(
        json_schema_extra={"example": "2023-10-01"},
    )
    slope_area_ratio_percentage: Optional[float] = Field(
        json_schema_extra={"example": 10.0},
    )
    total_bdf_resinous_area_hectare: Optional[float] = Field(
        json_schema_extra={"example": 10.0}
    )
    total_bdf_deciduous_area_hectare: Optional[float] = Field(
        json_schema_extra={"example": 10.0}
    )
    total_bdf_mixed_area_hectare: Optional[float] = Field(
        json_schema_extra={"example": 10.0}
    )
    total_bdf_poplar_area_hectare: Optional[float] = Field(
        json_schema_extra={"example": 10.0}
    )
    model_config = ConfigDict(from_attributes=True)


def sum_area(clear_cuts: list[ClearCut], area_attr: str) -> float:
    return sum(getattr(cc, area_attr, 0) or 0 for cc in clear_cuts)


def report_to_report_preview_schema(
    report: ClearCutReport,
) -> ClearCutReportPreviewSchema:
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
        average_location=Point.model_validate_json(report.average_location_json),
        rules_ids=[str(rule.id) for rule in report.rules],
        status=report.status,
        slope_area_ratio_percentage=report.slope_area_ratio_percentage,
        created_at=report.created_at.date(),
        updated_at=report.updated_at.date(),
        city=report.city.name,
        total_area_hectare=report.total_area_hectare,
        total_bdf_resinous_area_hectare=report.total_bdf_resinous_area_hectare,
        total_bdf_deciduous_area_hectare=report.total_bdf_deciduous_area_hectare,
        total_bdf_mixed_area_hectare=report.total_bdf_mixed_area_hectare,
        total_bdf_poplar_area_hectare=report.total_bdf_poplar_area_hectare,
        last_cut_date=max(
            clear_cut.observation_end_date for clear_cut in report.clear_cuts
        ).date(),
    )


class CountedPoint(BaseModel):
    count: int
    point: Point


class ClusterizedPointsResponseSchema(BaseModel):
    total: int
    content: list[CountedPoint]


class ClearCutMapResponseSchema(BaseModel):
    points: ClusterizedPointsResponseSchema
    previews: list[ClearCutReportPreviewSchema]

    model_config = ConfigDict(from_attributes=True)
