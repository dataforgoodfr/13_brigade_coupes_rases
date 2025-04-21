from logging import getLogger
from typing import Optional

from fastapi import HTTPException, status
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
from sqlalchemy.orm import Query, Session, aliased

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
from app.schemas.rule import RulesSchema
from app.services.rules import (
    list_rules,
)

logger = getLogger(__name__)


class GeoBounds(BaseModel):
    south_west_latitude: float
    south_west_longitude: float
    north_east_latitude: float
    north_east_longitude: float


class Filters(BaseModel):
    bounds: Optional[GeoBounds] = None
    report_id: Optional[int] = None
    min_area_hectare: Optional[float] = None
    max_area_hectare: Optional[float] = None
    cut_years: list[int] = []
    departments_ids: list[int] = []
    statuses: list[str] = []
    has_ecological_zonings: Optional[bool] = None
    excessive_slope: Optional[bool] = None


def query_reports(db: Session, filters: Optional[Filters]) -> Query[ClearCutReport]:
    if filters is not None and filters.bounds is not None:
        envelope = ST_MakeEnvelope(
            filters.bounds.south_west_longitude,
            filters.bounds.south_west_latitude,
            filters.bounds.north_east_longitude,
            filters.bounds.north_east_latitude,
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


def query_aggregated_clear_cuts_grouped_by_report_id(db: Session, rules: RulesSchema):
    return (
        db.query(
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
            func.sum(ClearCut.bdf_mixed_area_hectare).label(
                "total_bdf_mixed_area_hectare"
            ),
            func.sum(ClearCut.bdf_poplar_area_hectare).label(
                "total_bdf_poplar_area_hectare"
            ),
            func.sum(ClearCut.bdf_resinous_area_hectare).label(
                "total_bdf_resinous_area_hectare"
            ),
            func.sum(
                case(
                    (
                        ClearCutEcologicalZoning.ecological_zoning_id.in_(
                            rules.ecological_zoning.ecological_zonings_ids
                        ),
                        1,
                    ),
                    else_=0,
                ),
            ).label("total_ecological_zoning_rule_matches"),
        )
        .join(ClearCutEcologicalZoning, ClearCut.ecological_zonings, isouter=True)
        .group_by(ClearCut.report_id)
    )


def query_reports_with_additional_data(
    db: Session,
    reports_in_boundary: Query[ClearCutReport],
    aggregated_cuts,
    rules: RulesSchema,
):
    report_alias = aliased(ClearCutReport, reports_in_boundary)

    return (
        db.query(
            report_alias,
            aggregated_cuts,
            case(
                (
                    aggregated_cuts.c.total_area_hectare > rules.area.threshold,
                    rules.area.id,
                ),
                else_=None,
            ).label("area_rule_id"),
            case(
                (
                    report_alias.slope_area_ratio_percentage > rules.slope.threshold,
                    rules.slope.id,
                ),
                else_=None,
            ).label("slope_rule_id"),
            case(
                (
                    and_(
                        aggregated_cuts.c.total_ecological_zoning_area_hectare
                        > rules.ecological_zoning.threshold,
                        aggregated_cuts.c.total_ecological_zoning_rule_matches > 0,
                    ),
                    rules.ecological_zoning.id,
                ),
                else_=None,
            ).label("ecological_zoning_rule_id"),
            Department.id.label("department_id"),
        )
        .join(aggregated_cuts, report_alias.id == aggregated_cuts.c.report_id)
        .join(City, report_alias.city)
        .join(Department, City.department)
    )


def query_clearcuts_filtered(db: Session, filters: Optional[Filters]):
    rules = list_rules(db)
    reports_in_boundaries = query_reports(db, filters).subquery()
    aggregated_clear_cuts = query_aggregated_clear_cuts_grouped_by_report_id(
        db, rules
    ).subquery()
    reports = query_reports_with_additional_data(
        db, reports_in_boundaries, aggregated_clear_cuts, rules
    ).subquery()
    reports_with_filters = db.query(aliased(ClearCutReport, reports), reports)
    reports_with_filters = reports_with_filters.filter(
        or_(
            reports.c.ecological_zoning_rule_id.is_not(None),
            reports.c.slope_rule_id.is_not(None),
            reports.c.area_rule_id.is_not(None),
        )
    )
    if filters is None:
        return reports_with_filters
    if filters.report_id is not None:
        reports_with_filters = reports_with_filters.filter(
            reports.c.report_id == filters.report_id
        )
    if filters.has_ecological_zonings:
        reports_with_filters = reports_with_filters.filter(
            reports.c.ecological_zoning_rule_id.is_not(None)
        )
    elif filters.has_ecological_zonings is not None:
        reports_with_filters = reports_with_filters.filter(
            reports.c.ecological_zoning_rule_id.is_(None)
        )
    if filters.excessive_slope:
        reports_with_filters = reports_with_filters.filter(
            reports.c.slope_rule_id.is_not(None)
        )
    elif filters.excessive_slope is not None:
        reports_with_filters = reports_with_filters.filter(
            reports.c.slope_rule_id.is_(None)
        )

    if len(filters.cut_years) > 0:
        cut_years_intervals = [
            and_(
                func.extract("year", reports.c.cut_start) <= year,
                func.extract("year", reports.c.cut_end) >= year,
            )
            for year in filters.cut_years
        ]
        reports_with_filters = reports_with_filters.filter(or_(*cut_years_intervals))

    if len(filters.departments_ids) > 0:
        reports_with_filters = reports_with_filters.filter(
            reports.c.department_id.in_(map(int, filters.departments_ids))
        )

    if len(filters.statuses) > 0:
        reports_with_filters = reports_with_filters.filter(
            reports.c.status.in_(filters.statuses)
        )

    if filters.min_area_hectare is not None:
        reports_with_filters = reports_with_filters.filter(
            reports.c.total_area_hectare >= filters.min_area_hectare
        )

    if filters.max_area_hectare is not None:
        reports_with_filters = reports_with_filters.filter(
            reports.c.total_area_hectare <= filters.max_area_hectare
        )
    return reports_with_filters


def get_report_preview_by_id(
    db: Session, report_id: int
) -> ClearCutReportPreviewSchema:
    report = query_clearcuts_filtered(db, Filters(report_id=report_id)).first()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clear cut report {report_id} not found",
        )
    return row_to_report_preview_schema(report)


def build_clearcuts_map(db: Session, filters: Filters) -> ClearCutMapResponseSchema:
    reports_with_filters = query_clearcuts_filtered(db, filters)
    points = reports_with_filters.all()
    reports_with_filters = reports_with_filters.limit(30).all()
    map_response = ClearCutMapResponseSchema(
        points=[Point.model_validate_json(point[8]) for point in points],
        previews=list(map(row_to_report_preview_schema, reports_with_filters)),
    )
    return map_response
