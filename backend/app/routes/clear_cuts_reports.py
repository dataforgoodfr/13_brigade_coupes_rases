from logging import getLogger
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Response, status
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.config import settings
from app.deps import db_session
from app.models import ClearCutReport, User
from app.schemas.base import BaseSchema
from app.schemas.clear_cut import ClearCutResponseSchema
from app.schemas.clear_cut_form import ClearCutFormCreate, ClearCutFormResponse
from app.schemas.clear_cut_report import (
    ClearCutReportPutRequestSchema,
    ClearCutReportResponseSchema,
    CreateClearCutsReportCreateRequestSchema,
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
    sync_clear_cuts_reports,
    update_clear_cut_report,
    volunteer_create_clear_cut_report,
)
from app.services.user_auth import get_current_user, get_optional_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-reports", tags=["ClearcutsReports"])


# TODO: (unsecure) Workaround to sync the clear cuts after seeding
@router.post("/sync-reports", status_code=204)
def sync_clear_cut_reports(db: Session = db_session):
    sync_clear_cuts_reports(db)


def authenticate(x_imports_token: str = Header(default="")):
    if x_imports_token != settings.IMPORTS_TOKEN or x_imports_token == "":
        raise AppHTTPException(
            status_code=401, type="INVALID_TOKEN", detail="Invalid token"
        )


@router.post(
    "/", dependencies=[Depends(authenticate)], status_code=status.HTTP_201_CREATED
)
def post_report(
    response: Response,
    params: CreateClearCutsReportCreateRequestSchema,
    db: Session = db_session,
):
    try:
        clearcut = create_clear_cut_report(db, params)
        response.headers["location"] = f"/api/v1/clear-cuts-reports/{clearcut.id}"
    except ValueError as err:
        raise AppHTTPException(
            status_code=400, type="INVALID_REPORT", detail=str(err)
        ) from err


class VolunteerCreateRequestSchema(BaseSchema):
    polygon: dict
    city_zip_code: str


@router.post(
    "/volunteer-create",
    status_code=status.HTTP_201_CREATED,
)
def volunteer_create(
    response: Response,
    params: VolunteerCreateRequestSchema,
    user: User = Depends(get_current_user),
    db: Session = db_session,
):
    """Authenticated volunteers can create a new clear-cut report from a drawn polygon.
    The report is created with status 'to_validate' and must be validated by an admin.
    """
    try:
        report = volunteer_create_clear_cut_report(
            db=db,
            polygon_geojson=params.polygon,
            city_zip_code=params.city_zip_code,
            volunteer=user,
        )
        response.headers["location"] = f"/api/v1/clear-cuts-reports/{report.id}"
        return {
            "id": str(report.id),
            "message": "Votre signalement a bien été enregistré. Un administrateur l'examinera et le validera prochainement.",
        }
    except ValueError as err:
        raise AppHTTPException(
            status_code=400, type="INVALID_REPORT", detail=str(err)
        ) from err


@router.get(
    "/",
    response_model=PaginationResponseSchema[ClearCutReportResponseSchema],
    response_model_exclude_none=True,
)
def list_clear_cuts_reports(
    db: Session = db_session,
    page: int = 0,
    size: int = 10,
    current_user: User | None = Depends(get_optional_current_user),
    assigned_to_me: bool = False,
    admin_action_required: bool = False,
) -> PaginationResponseSchema[ClearCutReportResponseSchema]:
    logger.info(db)
    return find_clearcuts_reports(
        db,
        url="/api/v1/clear-cuts-reports",
        page=page,
        size=size,
        current_user=current_user,
        assigned_to_me=assigned_to_me,
        admin_action_required=admin_action_required,
    )


@router.put(
    "/{report_id}",
    response_model=None,
    status_code=status.HTTP_204_NO_CONTENT,
    response_model_exclude_none=True,
)
def update_existing_clear_cut_report(
    report_id: int,
    item: ClearCutReportPutRequestSchema,
    user: User = Depends(get_current_user),
    db: Session = db_session,
) -> None:
    logger.info(db)
    update_clear_cut_report(report_id, db, user, item)


@router.get(
    "/{report_id}",
    response_model=ClearCutReportResponseSchema,
    response_model_exclude_none=True,
)
def get_by_id(
    report_id: int,
    db: Session = db_session,
    current_user: User | None = Depends(get_optional_current_user),
) -> ClearCutReportResponseSchema:
    logger.info(db)
    return get_report_response_by_id(report_id, db, current_user)


@router.post(
    "/{report_id}/request-assignment",
    status_code=status.HTTP_200_OK,
)
def request_assignment(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = db_session,
):
    """Volunteer requests to be assigned to this report. Requires admin validation."""
    report = db.query(ClearCutReport).filter(ClearCutReport.id == report_id).first()
    if not report:
        raise AppHTTPException(
            status_code=404, type="NOT_FOUND", detail="Report not found"
        )
    if report.user_id is not None:
        raise AppHTTPException(
            status_code=400,
            type="ALREADY_ASSIGNED",
            detail="Report is already assigned",
        )
    if report.assignment_requested_by_id is not None:
        raise AppHTTPException(
            status_code=400,
            type="REQUEST_PENDING",
            detail="An assignment request is already pending",
        )
    report.assignment_requested_by_id = user.id
    db.commit()
    return {"message": "Assignment request submitted, waiting for admin validation"}


@router.post(
    "/{report_id}/cancel-request",
    status_code=status.HTTP_200_OK,
)
def cancel_assignment_request(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = db_session,
):
    """Volunteer cancels their pending assignment request."""
    report = db.query(ClearCutReport).filter(ClearCutReport.id == report_id).first()
    if not report:
        raise AppHTTPException(
            status_code=404, type="NOT_FOUND", detail="Report not found"
        )
    if report.assignment_requested_by_id != user.id:
        raise AppHTTPException(
            status_code=403,
            type="FORBIDDEN",
            detail="You have no pending request for this report",
        )
    report.assignment_requested_by_id = None
    db.commit()
    return {"message": "Assignment request cancelled"}


@router.post(
    "/{report_id}/approve-assignment",
    status_code=status.HTTP_200_OK,
)
def approve_assignment(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = db_session,
):
    """Admin approves the pending assignment request."""
    if user.role != "admin":
        raise AppHTTPException(
            status_code=403,
            type="FORBIDDEN",
            detail="Only admins can approve assignments",
        )
    report = db.query(ClearCutReport).filter(ClearCutReport.id == report_id).first()
    if not report:
        raise AppHTTPException(
            status_code=404, type="NOT_FOUND", detail="Report not found"
        )
    if report.assignment_requested_by_id is None:
        raise AppHTTPException(
            status_code=400, type="NO_REQUEST", detail="No pending assignment request"
        )
    report.user_id = report.assignment_requested_by_id
    report.assignment_requested_by_id = None
    db.commit()
    return {"message": "Assignment approved"}


@router.post(
    "/{report_id}/reject-assignment",
    status_code=status.HTTP_200_OK,
)
def reject_assignment(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = db_session,
):
    """Admin rejects the pending assignment request."""
    if user.role != "admin":
        raise AppHTTPException(
            status_code=403,
            type="FORBIDDEN",
            detail="Only admins can reject assignments",
        )
    report = db.query(ClearCutReport).filter(ClearCutReport.id == report_id).first()
    if not report:
        raise AppHTTPException(
            status_code=404, type="NOT_FOUND", detail="Report not found"
        )
    if report.assignment_requested_by_id is None:
        raise AppHTTPException(
            status_code=400, type="NO_REQUEST", detail="No pending assignment request"
        )
    report.assignment_requested_by_id = None
    db.commit()
    return {"message": "Assignment request rejected"}


@router.post(
    "/{report_id}/unassign",
    status_code=status.HTTP_200_OK,
)
def unassign_report_from_me(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = db_session,
):
    """Admin or assigned volunteer unassigns the report."""
    report = db.query(ClearCutReport).filter(ClearCutReport.id == report_id).first()
    if not report:
        raise AppHTTPException(
            status_code=404, type="NOT_FOUND", detail="Report not found"
        )
    if user.role != "admin" and report.user_id != user.id:
        raise AppHTTPException(
            status_code=403,
            type="FORBIDDEN",
            detail="You are not assigned to this report",
        )
    report.user_id = None
    db.commit()
    return {"message": "Unassigned successfully"}


@router.get(
    "/{report_id}/clear-cuts",
    response_model=PaginationResponseSchema[ClearCutResponseSchema],
    response_model_exclude_none=True,
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
    response_model=PaginationResponseSchema[ClearCutFormResponse],
    response_model_exclude_none=True,
)
def list_clear_cut_forms(
    report_id: int, db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutFormResponse]:
    logger.info(db)
    return find_clear_cut_form_by_report_id(
        db,
        report_id=report_id,
        url=f"/api/v1/clear-cuts-reports/{report_id}/forms",
        page=page,
        size=size,
    )


@router.get(
    "/{report_id}/forms/{form_id}",
    response_model=ClearCutFormResponse,
    response_model_exclude_none=True,
)
def get_form_by_id(
    report_id: int,
    form_id: int,
    db: Session = db_session,
) -> ClearCutFormResponse:
    logger.info(db)
    form = get_clear_cut_form_by_id(db, form_id)
    return form


@router.post("/{report_id}/forms", status_code=status.HTTP_201_CREATED)
def add_clearcut_form_version(
    report_id: int,
    response: Response,
    new_version: ClearCutFormCreate,
    db: Session = db_session,
    editor: User = Depends(get_current_user),
    etag: Annotated[str | None, Header()] = None,
):
    logger.info(db)
    form = add_clear_cut_form_entry(db, editor, report_id, new_version, etag)
    response.headers["location"] = (
        f"/api/v1/clear-cuts-reports/{report_id}/forms/{form.id}"
    )
