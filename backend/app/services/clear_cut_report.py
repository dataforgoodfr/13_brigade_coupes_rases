from logging import getLogger

from fastapi import HTTPException, status
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import (
    ST_Centroid,
    ST_Multi,
    ST_Union,
)
from geoalchemy2.shape import to_shape
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

from app.models import (
    SRID,
    ClearCut,
    ClearCutEcologicalZoning,
    ClearCutReport,
)
from app.schemas.clear_cut_report import (
    ClearCutReportPatchSchema,
    ClearCutReportResponseSchema,
    CreateClearCutsReportCreateSchema,
    report_to_response_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.schemas.rule import AllRules
from app.services.city import get_city_by_zip_code
from app.services.ecological_zoning import find_or_add_ecological_zonings
from app.services.rules import (
    list_rules,
)

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
                aggregated_cuts.c.total_area_hectare > rules.area.threshold,
                rules.area.id,
            ),
            else_=None,
        ).label("area_rule_id"),
        case(
            (
                ClearCutReport.slope_area_hectare > rules.slope.threshold,
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
    db: Session, report: CreateClearCutsReportCreateSchema
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


def update_clear_cut_report(id: int, db: Session, report: ClearCutReportPatchSchema):
    clearcut = db.get(ClearCutReport, id)
    if not clearcut:
        raise HTTPException(status_code=404, detail="ClearCut not found")
    update_data = report.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(clearcut, key, value)
    db.commit()
    db.refresh(clearcut)
    clearcut.location = to_shape(clearcut.location).wkt
    clearcut.boundary = to_shape(clearcut.boundary).wkt
    return clearcut


def find_clearcuts_reports(
    db: Session, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutReportResponseSchema]:
    reports = db.query(ClearCutReport).offset(page * size).limit(size).all()
    reports_count = db.query(ClearCutReport.id).count()
    reports_response = map(report_to_response_schema, reports)
    return PaginationResponseSchema(
        content=list(reports_response),
        metadata=PaginationMetadataSchema.create(
            page=page, size=size, total_count=reports_count, url=url
        ),
    )


def get_report_by_id(db: Session, report_id: int) -> ClearCutReport:
    report = db.get(ClearCutReport, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Report not found by id {id}"
        )
    return report


def get_report_response_by_id(id: int, db: Session) -> ClearCutReportResponseSchema:
    return report_to_response_schema(get_report_by_id(db, id))
