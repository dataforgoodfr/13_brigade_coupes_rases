from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import SRID, ClearCut, ClearCutEcologicalZoning, ClearCutReport
from app.schemas.clear_cut_report import (
    CreateClearCutsReportCreateSchema,
    ClearCutReportPatchSchema,
    ClearCutReportResponseSchema,
    report_to_response_schema,
)
from logging import getLogger
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape

from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.services.city import get_city_by_zip_code
from app.services.ecological_zoning import find_or_add_ecological_zonings
from fastapi import status

logger = getLogger(__name__)


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
                ecological_zonings=[
                    ClearCutEcologicalZoning(
                        ecological_zoning_id=zoning.id,
                        area_hectare=next(
                            z for z in clear_cut.ecological_zonings if z.code == zoning.code
                        ).area_hectare,
                    )
                    for zoning in find_or_add_ecological_zonings(
                        db, clear_cut.ecological_zonings
                    )
                ],
            )
            for clear_cut in report.clear_cuts
        ],
        slope_area_ratio_percentage=report.slope_area_ratio_percentage,
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
    clearcut.location = to_shape(clearcut.location, srid=SRID).wkt
    clearcut.boundary = to_shape(clearcut.boundary, srid=SRID).wkt
    return clearcut


def find_clearcuts_reports(
    db: Session, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutReportResponseSchema]:
    reports = db.query(ClearCutReport).offset(page * size).limit(size).all()
    reports_count = db.query(ClearCutReport.id).count()
    reports = map(
        report_to_response_schema,
        reports,
    )
    return PaginationResponseSchema(
        content=list(reports),
        metadata=PaginationMetadataSchema(
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
