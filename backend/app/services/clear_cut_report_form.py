from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import ClearCutReportForm, User
from fastapi import status

from logging import getLogger

from app.schemas.clear_cut_report_form import (
    ClearCutReportFormBase,
    ClearCutReportFormWithStrategyResponse,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema


logger = getLogger(__name__)


def get_clearcut_report_form_by_id(
    db: Session, report_form_id: int
) -> ClearCutReportFormWithStrategyResponse:
    report_form = db.get(ClearCutReportForm, report_form_id)
    if report_form is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Report form not found by id {id}"
        )

    return report_form


def update_clearcut_report_form_by_id(
    db: Session, report_form_id: int, clearcutReportIn: ClearCutReportFormBase
):
    # clearcutReport = db.query(ClearCutReportForm).filter(ClearCutReportForm.report == report_id).first()
    report_form = get_clearcut_report_form_by_id(db, report_form_id)
    if not report_form:
        raise HTTPException(status_code=404, detail=f"Report form not found by id {id}")
    update_data = clearcutReportIn.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report_form, key, value)
    db.commit()
    return get_clearcut_report_form_by_id(db, report_form_id)


def create_clearcut_form(
    db: Session, editor: User, report_id: int, clearcutReportIn: ClearCutReportFormBase
):
    clearcutReportIn_dict = vars(clearcutReportIn)
    new_clear_cut_form = ClearCutReportForm(**clearcutReportIn_dict)
    new_clear_cut_form.report_id = report_id
    new_clear_cut_form.editor_id = editor.id

    db.add(new_clear_cut_form)
    db.commit()
    db.refresh(new_clear_cut_form)
    return new_clear_cut_form


def find_clear_cut_form_by_report_id(
    db: Session, report_id: int, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutReportFormWithStrategyResponse]:
    clear_cut_report_forms = (
        db.query(ClearCutReportForm)
        .filter(ClearCutReportForm.report_id == report_id)
        .offset(page * size)
        .limit(size)
    )
    clear_cuts_count = (
        db.query(ClearCutReportForm.id)
        .filter(ClearCutReportForm.report_id == report_id)
        .count()
    )
    return PaginationResponseSchema(
        content=list(clear_cut_report_forms),
        metadata=PaginationMetadataSchema(
            page=page, size=size, total_count=clear_cuts_count, url=url
        ),
    )
