from datetime import datetime
from logging import getLogger

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ClearCutForm, User
from app.schemas.clear_cut_form import (
    ClearCutFormBase,
    ClearCutFormWithStrategyResponse,
    ClearCutReportFormWithStrategy,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema

logger = getLogger(__name__)


def get_clear_cut_form_by_id(
    db: Session, form_id: int
) -> ClearCutFormWithStrategyResponse:
    report_form = db.get(ClearCutForm, form_id)
    if report_form is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report form not found by id {form_id}",
        )

    return report_form


def update_clear_cut_form_by_id(
    db: Session, report_form_id: int, clearcutReportIn: ClearCutFormBase
):
    report_form = get_clear_cut_form_by_id(db, report_form_id)
    if not report_form:
        raise HTTPException(
            status_code=404, detail=f"Report form not found by id {report_form_id}"
        )
    update_data = clearcutReportIn.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report_form, key, value)
    db.commit()
    return get_clear_cut_form_by_id(db, report_form_id)


def add_clear_cut_form_entry(
    db: Session,
    editor: User,
    report_id: int,
    clear_cut_report_in: ClearCutReportFormWithStrategy,
):
    new_clear_cut_form_entry = ClearCutForm(
        report_id=report_id,
        editor_id=editor.id,
        report_updated_at=datetime.now(),
        inspection_date=clear_cut_report_in.inspection_date,
        weather=clear_cut_report_in.weather,
        forest_description=clear_cut_report_in.forest_description,
        remainingTrees=clear_cut_report_in.remainingTrees,
        species=clear_cut_report_in.species,
        workSignVisible=clear_cut_report_in.workSignVisible,
        waterzone_description=clear_cut_report_in.waterzone_description,
        protected_zone_description=clear_cut_report_in.protected_zone_description,
        soil_state=clear_cut_report_in.soil_state,
        other=clear_cut_report_in.other,
        ecological_zone=clear_cut_report_in.ecological_zone,
        ecological_zone_type=clear_cut_report_in.ecological_zone_type,
        nearby_zone=clear_cut_report_in.nearby_zone,
        nearby_zone_type=clear_cut_report_in.nearby_zone_type,
        protected_species=clear_cut_report_in.protected_species,
        protected_habitats=clear_cut_report_in.protected_habitats,
        ddt_request=clear_cut_report_in.ddt_request,
        ddt_request_owner=clear_cut_report_in.ddt_request_owner,
        compagny=clear_cut_report_in.compagny,
        subcontractor=clear_cut_report_in.subcontractor,
        landlord=clear_cut_report_in.landlord,
        pefc_fsc_certified=clear_cut_report_in.pefc_fsc_certified,
        over_20_ha=clear_cut_report_in.over_20_ha,
        psg_required_plot=clear_cut_report_in.psg_required_plot,
    )

    if editor.role == "admin":
        new_clear_cut_form_entry.relevant_for_pefc_complaint = (
            clear_cut_report_in.relevant_for_pefc_complaint
        )
        new_clear_cut_form_entry.relevant_for_rediii_complaint = (
            clear_cut_report_in.relevant_for_rediii_complaint
        )
        new_clear_cut_form_entry.relevant_for_ofb_complaint = (
            clear_cut_report_in.relevant_for_ofb_complaint
        )
        new_clear_cut_form_entry.relevant_for_alert_cnpf_ddt_srgs = (
            clear_cut_report_in.relevant_for_alert_cnpf_ddt_srgs
        )
        new_clear_cut_form_entry.relevant_for_alert_cnpf_ddt_psg_thresholds = (
            clear_cut_report_in.relevant_for_alert_cnpf_ddt_psg_thresholds
        )
        new_clear_cut_form_entry.relevant_for_psg_request = (
            clear_cut_report_in.relevant_for_psg_request
        )
        new_clear_cut_form_entry.request_engaged = clear_cut_report_in.request_engaged
    else:
        # Get last clearcutform entry
        last_form_entry = (
            db.query(ClearCutForm).order_by(ClearCutForm.id.desc()).first()
        )

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
    db.commit()
    db.refresh(new_clear_cut_form_entry)
    return new_clear_cut_form_entry


def find_clear_cut_form_by_report_id(
    db: Session, report_id: int, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutFormWithStrategyResponse]:
    clear_cut_report_forms = (
        db.query(ClearCutForm)
        .filter(ClearCutForm.report_id == report_id)
        .offset(page * size)
        .limit(size)
    )
    clear_cuts_count = (
        db.query(ClearCutForm.id).filter(ClearCutForm.report_id == report_id).count()
    )
    return PaginationResponseSchema(
        content=list(clear_cut_report_forms),
        metadata=PaginationMetadataSchema(
            page=page, size=size, total_count=clear_cuts_count, url=url
        ),
    )
