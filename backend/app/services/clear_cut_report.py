from logging import getLogger

from fastapi import status
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import ST_Centroid, ST_Multi, ST_Union
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.models import SRID, ClearCut, ClearCutEcologicalZoning, ClearCutReport, User
from app.schemas.clear_cut_report import (
    ClearCutReportPutRequestSchema,
    ClearCutReportResponseSchema,
    CreateClearCutsReportCreateRequestSchema,
    report_to_response_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.schemas.rule import AllRules
from app.services.city import get_city_by_zip_code
from app.services.ecological_zoning import find_or_add_ecological_zonings
from app.services.rules import list_rules

logger = getLogger(__name__)


def query_aggregated_clear_cuts_grouped_by_report_id(db: Session, rules: AllRules):
    return (
        db.query(
            ST_Centroid(ST_Multi(ST_Union(ClearCut.location))).label(
                "average_location"
            ),
            ClearCut.report_id,
            func.sum(ClearCut.area_hectare).label("total_area_hectare"),
            func.min(ClearCut.observation_start_date).label("cut_start"),
            func.max(ClearCut.observation_end_date).label("cut_end"),
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
                            [
                                ecological_zoning.id
                                for ecological_zoning in rules.ecological_zoning.ecological_zonings
                            ]
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
    aggregated_cuts,
    rules: AllRules,
):
    return db.query(
        ClearCutReport,
        aggregated_cuts,
        case(
            (
                aggregated_cuts.c.total_area_hectare >= rules.area.threshold,
                rules.area.id,
            ),
            else_=None,
        ).label("area_rule_id"),
        case(
            (
                ClearCutReport.slope_area_hectare >= rules.slope.threshold,
                rules.slope.id,
            ),
            else_=None,
        ).label("slope_rule_id"),
        case(
            (
                aggregated_cuts.c.total_ecological_zoning_area_hectare
                >= rules.ecological_zoning.threshold,
                rules.ecological_zoning.id,
            ),
            else_=None,
        ).label("ecological_zoning_rule_id"),
    ).join(aggregated_cuts, ClearCutReport.id == aggregated_cuts.c.report_id)


def sync_clear_cuts_reports(db: Session):
    rules = list_rules(db)
    aggregated_cuts = query_aggregated_clear_cuts_grouped_by_report_id(db, rules)
    rows = query_reports_with_additional_data(
        db, aggregated_cuts.subquery(), rules
    ).all()
    report: ClearCutReport
    for row in rows:
        [
            report,
            average_location,
            report_id,
            total_area_hectare,
            cut_start,
            cut_end,
            total_ecological_zoning_area_hectare,
            total_bdf_deciduous_area_hectare,
            total_bdf_mixed_area_hectare,
            total_bdf_poplar_area_hectare,
            total_bdf_resinous_area_hectare,
            total_ecological_zoning_rule_matches,
            area_rule_id,
            slope_rule_id,
            ecological_zoning_rule_id,
        ] = row
        report.average_location = average_location
        report.total_area_hectare = total_area_hectare
        report.last_cut_date = cut_end
        report.first_cut_date = cut_start
        report.total_ecological_zoning_area_hectare = (
            total_ecological_zoning_area_hectare
        )
        report.total_bdf_deciduous_area_hectare = total_bdf_deciduous_area_hectare
        report.total_bdf_mixed_area_hectare = total_bdf_mixed_area_hectare
        report.total_bdf_poplar_area_hectare = total_bdf_poplar_area_hectare
        report.total_bdf_resinous_area_hectare = total_bdf_resinous_area_hectare
        report.total_ecological_zoning_rule_matches = (
            total_ecological_zoning_rule_matches
        )
        report.rules = list(
            filter(
                lambda rule: rule is not None,
                [
                    None if area_rule_id is None else rules.area,
                    None if slope_rule_id is None else rules.slope,
                    (
                        None
                        if ecological_zoning_rule_id is None
                        else rules.ecological_zoning
                    ),
                ],
            )
        )
    db.flush()
    db.commit()


def create_clear_cut_report(
    db: Session, report: CreateClearCutsReportCreateRequestSchema
) -> ClearCutReport:
    intersecting_clearcut = (
        db.query(ClearCut)
        .filter(
            or_(
                *[
                    ClearCut.boundary.ST_Intersects(
                        WKTElement(clear_cut.boundary.wkt, srid=SRID)
                    )
                    for clear_cut in report.clear_cuts
                ]
            )
        )
        .first()
    )
    if intersecting_clearcut:
        raise ValueError(
            f"New clearcut boundary intersects with existing clearcut ID {intersecting_clearcut.id}"
        )
    city = get_city_by_zip_code(db, report.city_zip_code)
    db_item = ClearCutReport(
        city=city,
        clear_cuts=[
            ClearCut(
                location=WKTElement(clear_cut.location.wkt),
                boundary=WKTElement(clear_cut.boundary.wkt),
                observation_start_date=clear_cut.observation_start_date,
                observation_end_date=clear_cut.observation_end_date,
                area_hectare=clear_cut.area_hectare,
                bdf_resinous_area_hectare=clear_cut.bdf_resinous_area_hectare,
                bdf_deciduous_area_hectare=clear_cut.bdf_deciduous_area_hectare,
                bdf_mixed_area_hectare=clear_cut.bdf_mixed_area_hectare,
                bdf_poplar_area_hectare=clear_cut.bdf_poplar_area_hectare,
                ecological_zoning_area_hectare=clear_cut.ecological_zoning_area_hectare,
                ecological_zonings=[
                    ClearCutEcologicalZoning(
                        ecological_zoning_id=zoning.id,
                    )
                    for zoning in find_or_add_ecological_zonings(
                        db, clear_cut.ecological_zonings
                    )
                ],
            )
            for clear_cut in report.clear_cuts
        ],
        slope_area_hectare=report.slope_area_hectare,
        status="to_validate",
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def volunteer_create_clear_cut_report(
    db: Session, polygon_geojson: dict, city_zip_code: str, volunteer: User
) -> ClearCutReport:
    """Create a new report from a volunteer-drawn polygon.

    Accepts a GeoJSON Polygon or MultiPolygon and wraps it into a ClearCutReport
    with status 'to_validate'. The volunteer is set as creator.
    Area is estimated from geometry using a simple spherical approximation.
    """
    import math
    from datetime import datetime as dt

    from shapely.geometry import shape

    geom_type = polygon_geojson.get("type")

    # Support Polygon or MultiPolygon from Geoman
    if geom_type not in ("Polygon", "MultiPolygon"):
        raise ValueError(f"Unsupported geometry type: {geom_type}")

    shapely_geom = shape(polygon_geojson)
    centroid = shapely_geom.centroid

    # Approximate area in hectares using degrees → meters conversion at centroid latitude
    # 1 degree latitude ≈ 111_320 m, 1 degree longitude ≈ 111_320 * cos(lat) m
    lat_rad = math.radians(centroid.y)
    meters_per_deg_lat = 111_320.0
    meters_per_deg_lng = 111_320.0 * math.cos(lat_rad)
    area_deg2 = shapely_geom.area  # in degrees²
    area_m2 = area_deg2 * meters_per_deg_lat * meters_per_deg_lng
    area_ha = round(area_m2 / 10_000, 4)

    centroid_wkt = f"POINT({centroid.x} {centroid.y})"

    # Build MultiPolygon WKT — Geoman always gives Polygon, wrap it
    if geom_type == "Polygon":
        exterior = shapely_geom.exterior.coords
        coords_str = ", ".join(f"{x} {y}" for x, y in exterior)
        boundary_wkt = f"MULTIPOLYGON((({coords_str})))"
    else:
        boundary_wkt = shapely_geom.wkt  # already MultiPolygon

    today = dt.utcnow()
    city = get_city_by_zip_code(db, city_zip_code)

    cut = ClearCut(
        location=WKTElement(centroid_wkt, srid=SRID),
        boundary=WKTElement(boundary_wkt, srid=SRID),
        observation_start_date=today,
        observation_end_date=today,
        area_hectare=area_ha,
    )

    report = ClearCutReport(
        city=city,
        clear_cuts=[cut],
        status="to_validate",
        user_id=None,
        assignment_requested_by_id=volunteer.id,
        average_location=WKTElement(centroid_wkt, srid=SRID),
        total_area_hectare=area_ha,
        last_cut_date=today,
        first_cut_date=today,
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def update_clear_cut_report(
    id: int, db: Session, connected_user: User, request: ClearCutReportPutRequestSchema
):
    user_id = None
    if connected_user.role == "volunteer":
        if request.user_id is not None and request.user_id != connected_user.id:
            raise AppHTTPException(
                status_code=403,
                type="INVALID_REQUESTER_RIGHTS",
                detail="Volunteer could not assign an other user",
            )
        user_id = connected_user.id
    if connected_user.role == "admin":
        user_id = request.user_id
    report = db.get(ClearCutReport, id)
    if not report:
        raise AppHTTPException(
            status_code=404,
            type="REPORT_NOT_FOUND",
            detail="Clear cut report not found",
        )

    report.user_id = user_id
    if user_id is not None:
        report.assignment_requested_by_id = None

    if request.status is not None:
        if connected_user.role == "admin":
            report.status = request.status
        else:
            raise AppHTTPException(
                status_code=403,
                type="INVALID_REQUESTER_RIGHTS",
                detail="Only admins can update report status directly",
            )

    db.commit()
    db.refresh(report)
    return report


def find_clearcuts_reports(
    db: Session,
    url: str,
    page: int = 0,
    size: int = 10,
    current_user: "User | None" = None,
    assigned_to_me: bool = False,
    admin_action_required: bool = False,
) -> PaginationResponseSchema[ClearCutReportResponseSchema]:
    from sqlalchemy.orm import joinedload

    query = db.query(ClearCutReport).options(
        joinedload(ClearCutReport.user),
        joinedload(ClearCutReport.assignment_requested_by),
    )
    if assigned_to_me and current_user:
        query = query.filter(ClearCutReport.user_id == current_user.id)
    if admin_action_required:
        query = query.filter(
            or_(
                ClearCutReport.status == "to_validate",
                ClearCutReport.assignment_requested_by_id.is_not(None),
            )
        )

    query = query.order_by(ClearCutReport.updated_at.desc())
    reports = query.offset(page * size).limit(size).all()
    reports_count = query.count()
    reports_response = map(
        lambda r: report_to_response_schema(r, current_user), reports
    )
    return PaginationResponseSchema(
        content=list(reports_response),
        metadata=PaginationMetadataSchema.create(
            page=page, size=size, total_count=reports_count, url=url
        ),
    )


def get_report_by_id(db: Session, report_id: int) -> ClearCutReport:
    report = db.query(ClearCutReport).filter(ClearCutReport.id == report_id).first()
    if report is None:
        raise AppHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            type="REPORT_NOT_FOUND",
            detail=f"Report not found by id {report_id}",
        )
    return report


def get_report_response_by_id(
    id: int, db: Session, current_user: "User | None" = None
) -> ClearCutReportResponseSchema:
    return report_to_response_schema(get_report_by_id(db, id), current_user)
