from logging import getLogger

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.deps import db_session
from app.services.clear_cut_report_form import (
    get_clearcut_report_form_by_id,
    update_clearcut_report_form_by_id,
)
from app.schemas.clear_cut_report_form import (
    ClearCutReportFormBase,
    ClearCutReportFormWithStrategy,
    ClearCutReportFormWithStrategyResponse,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-report-forms", tags=["Clear cut forms"])


@router.get("/{report_form_id}", response_model=ClearCutReportFormWithStrategyResponse)
def get_report_by_id(
    report_form_id: int, db: Session = db_session
) -> ClearCutReportFormWithStrategyResponse:
    logger.info(db)
    return get_clearcut_report_form_by_id(db, report_form_id)


@router.put("/{report_form_id}", response_model=ClearCutReportFormWithStrategyResponse)
def update_report(
    report_form_id: int, clearcutReportIn: ClearCutReportFormBase, db: Session = db_session
) -> ClearCutReportFormWithStrategyResponse:
    logger.info(db)
    return update_clearcut_report_form_by_id(db, report_form_id, clearcutReportIn)


@router.put(
    "/{report_form_id}/WithStrategy", response_model=ClearCutReportFormWithStrategyResponse
)
def update_legal_strategy(
    report_form_id: int,
    clearcutReportIn: ClearCutReportFormWithStrategy,
    db: Session = db_session,
) -> ClearCutReportFormWithStrategyResponse:
    logger.info(db)
    return update_clearcut_report_form_by_id(db, report_form_id, clearcutReportIn)
