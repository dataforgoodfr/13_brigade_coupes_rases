from logging import getLogger
from math import sqrt
from typing import Optional

from fastapi import HTTPException, status
from geoalchemy2.functions import (
    ST_AsGeoJSON,
    ST_Centroid,
    ST_ClusterWithin,
    ST_Contains,
    ST_MakeEnvelope,
    ST_NumGeometries,
    ST_SetSRID,
)
from geojson_pydantic import Point
from pydantic import BaseModel
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

from app.models import (
    SRID,
    City,
    ClearCutReport,
    Department,
    Rules,
)
from app.schemas.clear_cut_map import (
    ClearCutMapResponseSchema,
    ClearCutReportPreviewSchema,
    ClusterizedPointsResponseSchema,
    CountedPoint,
    report_to_report_preview_schema,
)
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
    departments_ids: list[str] = []
    statuses: list[str] = []
    has_ecological_zonings: Optional[bool] = None
    excessive_slope: Optional[bool] = None


def query_clearcuts_filtered(db: Session, filters: Optional[Filters]):
    rules = list_rules(db)

    reports_with_rules = (
        db.query(
            ClearCutReport.id,
            func.count(case((Rules.id == rules.area.id, 1), else_=None)).label(
                "area_rule_count"
            ),
            func.count(
                case((Rules.id == rules.ecological_zoning.id, 1), else_=None)
            ).label("ecological_zoning_rule_count"),
            func.count(case((Rules.id == rules.slope.id, 1), else_=None)).label(
                "slope_rule_count"
            ),
        )
        .join(Rules, ClearCutReport.rules, isouter=True)
        .group_by(ClearCutReport.id)
        .subquery()
    )
    reports = (
        db.query(ClearCutReport)
        .join(reports_with_rules, ClearCutReport.id == reports_with_rules.c.id)
        .filter(
            or_(
                reports_with_rules.c.area_rule_count > 0,
                reports_with_rules.c.ecological_zoning_rule_count > 0,
                reports_with_rules.c.slope_rule_count > 0,
            )
        )
    )

    if filters is None:
        return reports
    if filters.bounds is not None:
        envelope = ST_MakeEnvelope(
            filters.bounds.south_west_longitude,
            filters.bounds.south_west_latitude,
            filters.bounds.north_east_longitude,
            filters.bounds.north_east_latitude,
            SRID,
        )
        square = ST_SetSRID(envelope, SRID)
        reports = reports.filter(ST_Contains(square, ClearCutReport.average_location))

    if filters.report_id is not None:
        reports = reports.filter(ClearCutReport.id == filters.report_id)
    if filters.has_ecological_zonings:
        reports = reports.filter(
            reports_with_rules.c.ecological_zoning_rule_count > 0,
        )
    elif filters.has_ecological_zonings is not None:
        reports = reports.filter(
            reports_with_rules.c.ecological_zoning_rule_count == 0,
        )
    if filters.excessive_slope:
        reports = reports.filter(
            reports_with_rules.c.slope_rule_count > 0,
        )
    elif filters.excessive_slope is not None:
        reports = reports.filter(
            reports_with_rules.c.slope_rule_count == 0,
        )

    if len(filters.cut_years) > 0:
        cut_years_intervals = [
            and_(
                func.extract("year", ClearCutReport.first_cut_date) <= year,
                func.extract("year", ClearCutReport.last_cut_date) >= year,
            )
            for year in filters.cut_years
        ]
        reports = reports.filter(or_(*cut_years_intervals))

    if len(filters.departments_ids) > 0:
        reports = (
            reports.join(City, ClearCutReport.city)
            .join(Department, City.department)
            .filter(Department.id.in_(map(int, filters.departments_ids)))
        )

    if len(filters.statuses) > 0:
        reports = reports.filter(ClearCutReport.status.in_(filters.statuses))

    if filters.min_area_hectare is not None:
        print(f"Filtering by min area: {filters.min_area_hectare}")
        reports = reports.filter(
            ClearCutReport.total_area_hectare >= filters.min_area_hectare
        )

    if filters.max_area_hectare is not None:
        reports = reports.filter(
            ClearCutReport.total_area_hectare <= filters.max_area_hectare
        )
    return reports


def get_report_preview_by_id(
    db: Session, report_id: int
) -> ClearCutReportPreviewSchema:
    report = query_clearcuts_filtered(db, Filters(report_id=report_id)).first()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clear cut report {report_id} not found",
        )
    return report_to_report_preview_schema(report)


def build_clearcuts_map(
    db: Session, with_points: bool, filters: Filters
) -> ClearCutMapResponseSchema:
    reports_with_filters = query_clearcuts_filtered(db, filters)
    clusterized_points = ClusterizedPointsResponseSchema(total=0, content=[])

    if with_points is True:
        if filters.bounds is not None:
            area = (
                filters.bounds.south_west_longitude
                - filters.bounds.north_east_longitude
            ) * (
                filters.bounds.south_west_latitude - filters.bounds.north_east_latitude
            )
            # Needs to clusterized because with estimate that points are too many
            if area > 1:
                reports_cnt = reports_with_filters.count()
                print(f"COUNT {reports_cnt}")
                if reports_cnt == 0:
                    clusterized_points = ClusterizedPointsResponseSchema(
                        total=reports_cnt, content=[]
                    )
                else:
                    # Distance calculated to estimate the clusters size,
                    # if we have many points in an area the distance used by the cluster while be bigger
                    distance = sqrt(area / reports_cnt / 2)
                    clusters = db.query(
                        func.unnest(
                            ST_ClusterWithin(
                                reports_with_filters.subquery().c.average_location,
                                distance,
                            )
                        ).label("cluster"),
                    ).subquery()
                    clusterized_points = ClusterizedPointsResponseSchema(
                        total=reports_cnt,
                        content=[
                            CountedPoint(
                                count=row[0], point=Point.model_validate_json(row[1])
                            )
                            for row in db.query(
                                ST_NumGeometries(clusters.c.cluster).label(
                                    "points_cnt"
                                ),
                                ST_AsGeoJSON(ST_Centroid(clusters.c.cluster)),
                            ).all()
                        ],
                    )
            else:
                # If area is little clusters are useless
                clusterized_points = process_points_from_reports(reports_with_filters)
        else:
            # If area doesnt exists clusters are useless
            clusterized_points = process_points_from_reports(reports_with_filters)

    reports_with_filters = reports_with_filters.limit(30).all()
    map_response = ClearCutMapResponseSchema(
        points=clusterized_points,
        previews=list(map(report_to_report_preview_schema, reports_with_filters)),
    )
    return map_response


def process_points_from_reports(reports_with_filters):
    all_reports = reports_with_filters.all()
    clusterized_points = ClusterizedPointsResponseSchema(
        total=len(all_reports),
        content=[
            CountedPoint(
                count=1,
                point=Point.model_validate_json(report.average_location_json),
            )
            for report in all_reports
        ],
    )

    return clusterized_points
