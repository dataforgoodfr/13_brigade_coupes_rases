from logging import getLogger
from typing import Optional

from fastapi import HTTPException,status
from geoalchemy2.functions import (
    ST_AsGeoJSON,
    ST_Centroid,
    ST_Contains,
    ST_MakeEnvelope,
    ST_Multi,
    ST_SetSRID,
    ST_Union,
)
from geojson_pydantic import Point
from pydantic import BaseModel
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session, Query, aliased
from app.models import (
    SRID,
    City,
    ClearCut,
    ClearCutEcologicalZoning,
    ClearCutReport,
    Department,
)
from app.schemas.clear_cut_map import (
    ClearCutMapResponseSchema,
    ClearCutReportPreviewSchema,
    row_to_report_preview_schema,
)

logger = getLogger(__name__)


class GeoBounds(BaseModel):
    south_west_latitude: float
    south_west_longitude: float
    north_east_latitude: float
    north_east_longitude: float


class Filters(BaseModel):
    bounds: Optional[GeoBounds]
    min_area_hectare: Optional[float] = None
    max_area_hectare: Optional[float] = None
    cut_years: list[int] = None
    departments_ids: list[int]
    statuses: list[str]
    has_ecological_zonings: Optional[bool] = None


def query_reports(db: Session, bounds: Optional[GeoBounds]) -> Query[ClearCutReport]:
    if bounds is not None:
        envelope = ST_MakeEnvelope(
            bounds.south_west_longitude,
            bounds.south_west_latitude,
            bounds.north_east_longitude,
            bounds.north_east_latitude,
            SRID,
        )
        square = ST_SetSRID(envelope, SRID)
        reports_ids_in_boundaries = (
            db.query(ClearCut.report_id)
            .filter(ST_Contains(square, ClearCut.location))
            .group_by(ClearCut.report_id)
            .subquery()
        )
        return db.query(ClearCutReport).join(
            reports_ids_in_boundaries,
            reports_ids_in_boundaries.c.report_id == ClearCutReport.id,
        )
    return db.query(ClearCutReport)


def query_aggregated_clear_cuts_grouped_by_report_id(db: Session):
    return db.query(
        ST_AsGeoJSON(ST_Centroid(ST_Multi(ST_Union(ClearCut.location)))).label(
            "average_location"
        ),
        ClearCut.report_id,
        func.sum(ClearCut.area_hectare).label("total_area_hectare"),
        func.min(ClearCut.observation_start_date).label("cut_start"),
        func.max(ClearCut.observation_end_date).label("cut_end"),
        func.max(ClearCut.updated_at).label("last_update"),
        func.sum(ClearCut.ecological_zoning_area_hectare).label(
            "total_ecological_zoning_area_hectare"
        ),
        func.sum(ClearCut.bdf_deciduous_area_hectare).label(
            "total_bdf_deciduous_area_hectare"
        ),
        func.sum(ClearCut.bdf_mixed_area_hectare).label("total_bdf_mixed_area_hectare"),
        func.sum(ClearCut.bdf_poplar_area_hectare).label(
            "total_bdf_poplar_area_hectare"
        ),
        func.sum(ClearCut.bdf_resinous_area_hectare).label(
            "total_bdf_resinous_area_hectare"
        ),
    ).group_by(ClearCut.report_id)


def query_reports_with_additional_data(
    db: Session, reports_in_boundary: Query[ClearCutReport], aggregated_cuts
):
    report_alias = aliased(ClearCutReport, reports_in_boundary)
    return (
        db.query(report_alias, aggregated_cuts)
        .join(aggregated_cuts, report_alias.id == aggregated_cuts.c.report_id)
        .join(City, report_alias.city)
        .join(Department, City.department)
    )


def get_report_preview_by_id(
    db: Session, report_id: int
) -> ClearCutReportPreviewSchema:
    reports_in_boundaries = query_reports(db, None).subquery()
    aggregated_clear_cuts = query_aggregated_clear_cuts_grouped_by_report_id(
        db
    ).subquery()
    report = query_reports_with_additional_data(
        db,
        reports_in_boundaries,
        aggregated_clear_cuts,
    ).filter(ClearCutReport.id == report_id).first()
    if report is None: 
        raise HTTPException(status_code= status.HTTP_404_NOT_FOUND, detail=f"Clear cut report {report_id} not found")
    return row_to_report_preview_schema(report)


def build_clearcuts_map(db: Session, filters: Filters) -> ClearCutMapResponseSchema:
    reports_in_boundaries = query_reports(db, filters.bounds).subquery()
    aggregated_clear_cuts = query_aggregated_clear_cuts_grouped_by_report_id(
        db
    ).subquery()
    reports = query_reports_with_additional_data(
        db,
        reports_in_boundaries,
        aggregated_clear_cuts,
    )
    if filters.has_ecological_zonings:
        reports = reports.filter(reports.c.total_ecological_zoning_area_hectare > 0)
    elif filters.has_ecological_zonings is not None:
        reports = reports.filter(reports.c.total_ecological_zoning_area_hectare == 0)
    if len(filters.cut_years) > 0:
        cut_years_intervals = [
            and_(
                func.extract("year", reports.c.cut_start) <= year,
                func.extract("year", reports.c.cut_end) >= year,
            )
            for year in filters.cut_years
        ]
        reports = reports.filter(or_(*cut_years_intervals))

    if filters.departments_ids and len(filters.departments_ids) > 0:
        reports = reports.filter(Department.id.in_(map(int, filters.departments_ids)))

    if len(filters.statuses) > 0:
        reports = reports.filter(ClearCutReport.status.in_(filters.statuses))

    if filters.min_area_hectare is not None:
        reports = reports.filter(
            reports.c.total_area_hectare >= filters.min_area_hectare
        )

    if filters.max_area_hectare is not None:
        reports = reports.filter(
            reports.c.total_area_hectare <= filters.max_area_hectare
        )
    points = reports.all()
    # reports = reports.order_by(ClearCutReport.updated_at.desc()).limit(30).all()
    reports = reports.limit(30).all()

    map_response = ClearCutMapResponseSchema(
        points=[Point.model_validate_json(point[1]) for point in points],
        previews=list(map(row_to_report_preview_schema, reports)),
    )
    return map_response
