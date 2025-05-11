from logging import getLogger

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ClearCutForm, User
from app.schemas.clear_cut_form import (
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


def add_clear_cut_form_entry(
    db: Session,
    editor: User,
    report_id: int,
    new_version: ClearCutReportFormWithStrategy,
):
    new_clear_cut_form_entry = ClearCutForm(
        report_id=report_id,
        editor_id=editor.id,
        inspection_date=new_version.inspection_date,
        weather=new_version.weather,
        forest_description=new_version.forest_description,
        remainingTrees=new_version.remainingTrees,
        species=new_version.species,
        workSignVisible=new_version.workSignVisible,
        waterzone_description=new_version.waterzone_description,
        protected_zone_description=new_version.protected_zone_description,
        soil_state=new_version.soil_state,
        other=new_version.other,
        ecological_zone=new_version.ecological_zone,
        ecological_zone_type=new_version.ecological_zone_type,
        nearby_zone=new_version.nearby_zone,
        nearby_zone_type=new_version.nearby_zone_type,
        protected_species=new_version.protected_species,
        protected_habitats=new_version.protected_habitats,
        ddt_request=new_version.ddt_request,
        ddt_request_owner=new_version.ddt_request_owner,
        compagny=new_version.compagny,
        subcontractor=new_version.subcontractor,
        landlord=new_version.landlord,
        pefc_fsc_certified=new_version.pefc_fsc_certified,
        over_20_ha=new_version.over_20_ha,
        psg_required_plot=new_version.psg_required_plot,
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
    db.commit()
    db.refresh(new_clear_cut_form_entry)
    return new_clear_cut_form_entry


def find_clear_cut_form_by_report_id(
    db: Session, report_id: int, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutFormWithStrategyResponse]:
    forms = (
        db.query(ClearCutForm)
        .filter(ClearCutForm.report_id == report_id)
        .order_by(ClearCutForm.created_at.desc())
        .offset(page * size)
        .limit(size)
    )
    forms_count = (
        db.query(ClearCutForm.id).filter(ClearCutForm.report_id == report_id).count()
    )
    return PaginationResponseSchema(
        content=forms.all(),
        metadata=PaginationMetadataSchema(
            page=page, size=size, total_count=forms_count, url=url
        ),
    )
