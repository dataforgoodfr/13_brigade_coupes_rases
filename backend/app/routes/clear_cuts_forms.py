from logging import getLogger

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.clear_cut_report_form import (
    ClearCutReportFormBase,
    ClearCutReportFormWithStrategy,
    ClearCutReportFormWithStrategyResponse,
)
from app.services.clear_cut_report_form import (
    create_clearcut_form,
    get_clearcut_report_form_by_id,
)
from app.services.user_auth import get_admin_user, get_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-report-forms", tags=["Clear cut forms"])


@router.get("/{report_form_id}", response_model=ClearCutReportFormWithStrategyResponse)
def get_report_by_id(
    report_form_id: int,
    db: Session = db_session,
) -> ClearCutReportFormWithStrategyResponse:
    logger.info(db)
    form = get_clearcut_report_form_by_id(db, report_form_id)
    return form


@router.put("/{report_id}", response_model=ClearCutReportFormWithStrategyResponse)
def post_clearcut_form(
    report_id: int,
    clearcutReportIn: ClearCutReportFormBase,
    db: Session = db_session,
    editor=Depends(get_current_user),
) -> ClearCutReportFormWithStrategyResponse:
    logger.info(db)
    return create_clearcut_form(db, editor, report_id, clearcutReportIn)


@router.put(
    "/{report_id}/WithStrategy", response_model=ClearCutReportFormWithStrategyResponse
)
def post_legal_strategy(
    report_id: int,
    clearcutReportIn: ClearCutReportFormWithStrategy,
    db: Session = db_session,
    editor=Depends(get_admin_user),
) -> ClearCutReportFormWithStrategyResponse:
    logger.info(db)
    return create_clearcut_form(db, editor, report_id, clearcutReportIn)
