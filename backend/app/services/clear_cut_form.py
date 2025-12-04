from logging import getLogger

from fastapi import status
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.models import ClearCutForm, ClearCutReport, User
from app.schemas.clear_cut_form import (
    ClearCutFormCreate,
    ClearCutFormResponse,
    clear_cut_form_create_to_clear_cut_form,
    clear_cut_form_response_from_clear_cut_form,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema

logger = getLogger(__name__)


def get_clear_cut_form_by_id(db: Session, form_id: int) -> ClearCutFormResponse:
    report_form = db.get(ClearCutForm, form_id)
    if report_form is None:
        raise AppHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            type="REPORT_NOT_FOUND",
            detail=f"Report form not found by id {form_id}",
        )

    return clear_cut_form_response_from_clear_cut_form(report_form)


def add_clear_cut_form_entry(
    db: Session,
    editor: User,
    report_id: int,
    new_version: ClearCutFormCreate,
    etag: str | None,
) -> ClearCutForm:
    last_form = find_last_clear_cut_form_by_report_id(db, report_id)
    new_clear_cut_form_entry = clear_cut_form_create_to_clear_cut_form(
        new_version, editor, report_id
    )
    if last_form is not None and etag != last_form.etag:
        raise AppHTTPException(
            status_code=status.HTTP_409_CONFLICT,
            type="ETAG_MISMATCH",
            detail="The form has been modified since you last fetched it.",
        )
    if editor.role == "admin":
        new_clear_cut_form_entry.relevant_for_pefc_complaint = (
            new_version.relevant_for_pefc_complaint
        )
        new_clear_cut_form_entry.relevant_for_rediii_complaint = (
            new_version.relevant_for_rediii_complaint
        )
        new_clear_cut_form_entry.relevant_for_ofb_complaint = (
            new_version.relevant_for_ofb_complaint
        )
        new_clear_cut_form_entry.relevant_for_alert_cnpf_ddt_srgs = (
            new_version.relevant_for_alert_cnpf_ddt_srgs
        )
        new_clear_cut_form_entry.relevant_for_alert_cnpf_ddt_psg_thresholds = (
            new_version.relevant_for_alert_cnpf_ddt_psg_thresholds
        )
        new_clear_cut_form_entry.relevant_for_psg_request = (
            new_version.relevant_for_psg_request
        )
        new_clear_cut_form_entry.request_engaged = new_version.request_engaged
    else:
        # Get last clearcutform entry
        last_form_entry = (
            db.query(ClearCutForm)
            .filter(ClearCutForm.report_id == report_id)
            .order_by(ClearCutForm.created_at.desc())
            .first()
        )
        if last_form_entry is not None:
            new_clear_cut_form_entry.relevant_for_pefc_complaint = (
                last_form_entry.relevant_for_pefc_complaint
            )
            new_clear_cut_form_entry.relevant_for_rediii_complaint = (
                last_form_entry.relevant_for_rediii_complaint
            )
            new_clear_cut_form_entry.relevant_for_ofb_complaint = (
                last_form_entry.relevant_for_ofb_complaint
            )
            new_clear_cut_form_entry.relevant_for_alert_cnpf_ddt_srgs = (
                last_form_entry.relevant_for_alert_cnpf_ddt_srgs
            )
            new_clear_cut_form_entry.relevant_for_alert_cnpf_ddt_psg_thresholds = (
                last_form_entry.relevant_for_alert_cnpf_ddt_psg_thresholds
            )
            new_clear_cut_form_entry.relevant_for_psg_request = (
                last_form_entry.relevant_for_psg_request
            )
            new_clear_cut_form_entry.request_engaged = last_form_entry.request_engaged

    db.add(new_clear_cut_form_entry)

    # Update report status from "to_validate" to "validated" when form is submitted
    report = db.get(ClearCutReport, report_id)
    if report is not None and report.status == "to_validate":
        report.status = "validated"

    db.commit()
    db.refresh(new_clear_cut_form_entry)
    return new_clear_cut_form_entry


def find_clear_cut_form_by_report_id(
    db: Session, report_id: int, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutFormResponse]:
    forms = (
        db.query(ClearCutForm)
        .join(ClearCutReport)
        .join(User)
        .filter(ClearCutForm.report_id == report_id)
        .order_by(ClearCutForm.created_at.desc())
        .offset(page * size)
        .limit(size)
    )
    forms_count = (
        db.query(ClearCutForm.id).filter(ClearCutForm.report_id == report_id).count()
    )
    return PaginationResponseSchema(
        content=list(map(clear_cut_form_response_from_clear_cut_form, forms.all())),
        metadata=PaginationMetadataSchema.create(
            page=page, size=size, total_count=forms_count, url=url
        ),
    )


def find_last_clear_cut_form_by_report_id(
    db: Session, report_id: int
) -> ClearCutFormResponse | None:
    content = find_clear_cut_form_by_report_id(
        db, report_id, url="", page=0, size=1
    ).content
    return content[0] if len(content) > 0 else None
