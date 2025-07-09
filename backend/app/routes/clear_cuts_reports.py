from logging import getLogger

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import db_session
from app.schemas.clear_cut import ClearCutResponseSchema
from app.schemas.clear_cut_form import (
    ClearCutFormWithStrategyResponse,
    ClearCutReportFormWithStrategy,
)
from app.schemas.clear_cut_report import (
    ClearCutReportPatchSchema,
    ClearCutReportResponseSchema,
    CreateClearCutsReportCreateSchema,
)
from app.schemas.hateoas import PaginationResponseSchema
from app.services.clear_cut import find_clearcuts_by_report
from app.services.clear_cut_form import (
    add_clear_cut_form_entry,
    find_clear_cut_form_by_report_id,
    get_clear_cut_form_by_id,
)
from app.services.clear_cut_report import (
    create_clear_cut_report,
    find_clearcuts_reports,
    get_report_response_by_id,
    update_clear_cut_report,
)
from app.services.user_auth import get_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-reports", tags=["ClearcutsReports"])


def authenticate(x_imports_token: str = Header(default="")):
    if x_imports_token != settings.IMPORTS_TOKEN or x_imports_token == "":
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post(
    "/", dependencies=[Depends(authenticate)], status_code=status.HTTP_201_CREATED
)
def post_report(
    response: Response,
    params: CreateClearCutsReportCreateSchema,
    db: Session = db_session,
):
    try:
        clearcut = create_clear_cut_report(db, params)
        response.headers["location"] = f"/api/v1/clear-cuts-reports/{clearcut.id}"
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err


@router.get("/", response_model=PaginationResponseSchema[ClearCutReportResponseSchema])
def list_clear_cuts_reports(
    db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutReportResponseSchema]:
    logger.info(db)
    return find_clearcuts_reports(
        db, url="/api/v1/clear-cuts-reports", page=page, size=size
    )


@router.patch(
    "/{report_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT
)
def update_existing_clear_cut_report(
    report_id: int, item: ClearCutReportPatchSchema, db: Session = db_session
) -> None:
    logger.info(db)
    update_clear_cut_report(report_id, db, item)


@router.get("/{report_id}", response_model=ClearCutReportResponseSchema)
def get_by_id(report_id: int, db: Session = db_session) -> ClearCutReportResponseSchema:
    logger.info(db)
    return get_report_response_by_id(report_id, db)


@router.get(
    "/{report_id}/clear-cuts",
    response_model=PaginationResponseSchema[ClearCutResponseSchema],
)
def list_clear_cuts(
    report_id: int, db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutResponseSchema]:
    logger.info(db)
    return find_clearcuts_by_report(
        db,
        report_id=report_id,
        url=f"/api/v1/clear-cuts-reports/{report_id}/clear-cuts",
        page=page,
        size=size,
    )


@router.get(
    "/{report_id}/forms",
    response_model=PaginationResponseSchema[ClearCutFormWithStrategyResponse],
)
def list_clear_cut_forms(
    report_id: int, db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutFormWithStrategyResponse]:
    logger.info(db)
    return find_clear_cut_form_by_report_id(
        db,
        report_id=report_id,
        url=f"/api/v1/clear-cuts-reports/{report_id}/forms",
        page=page,
        size=size,
    )


@router.get(
    "/{report_id}/forms/{form_id}", response_model=ClearCutFormWithStrategyResponse
)
def get_form_by_id(
    form_id: int,
    db: Session = db_session,
) -> ClearCutFormWithStrategyResponse:
    logger.info(db)
    form = get_clear_cut_form_by_id(db, form_id)
    return form


@router.post("/{report_id}/forms", status_code=status.HTTP_201_CREATED)
def add_clearcut_form_version(
    report_id: int,
    response: Response,
    new_version: ClearCutReportFormWithStrategy,
    db: Session = db_session,
    editor=Depends(get_current_user),
):
    logger.info(db)
    form = add_clear_cut_form_entry(db, editor, report_id, new_version)
    response.headers["location"] = (
        f"/api/v1/clear-cuts-reports/{report_id}/forms/{form.id}"
    )
