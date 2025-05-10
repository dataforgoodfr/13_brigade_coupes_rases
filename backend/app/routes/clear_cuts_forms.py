from logging import getLogger

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.clear_cut_form import (
    ClearCutFormWithStrategyResponse,
    ClearCutReportFormWithStrategy,
)
from app.services.clear_cut_form import (
    add_clear_cut_form_entry,
    get_clear_cut_form_by_id,
)
from app.services.user_auth import get_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-forms", tags=["Clear cut forms"])


@router.get("/{form_id }", response_model=ClearCutFormWithStrategyResponse)
def get_form_by_id(
    form_id: int,
    db: Session = db_session,
) -> ClearCutFormWithStrategyResponse:
    logger.info(db)
    form = get_clear_cut_form_by_id(db, form_id)
    return form


@router.put("/{report_id}", response_model=ClearCutFormWithStrategyResponse)
def put_clearcut_form(
    report_id: int,
    clearcutReportIn: ClearCutReportFormWithStrategy,
    db: Session = db_session,
    editor=Depends(get_current_user),
) -> ClearCutFormWithStrategyResponse:
    logger.info(db)
    return add_clear_cut_form_entry(db, editor, report_id, clearcutReportIn)
