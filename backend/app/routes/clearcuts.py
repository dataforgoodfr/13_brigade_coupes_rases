from logging import getLogger

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.deps import get_db_session
from app.schemas.clearcut import ClearCutCreate, ClearCutPatch, ClearCutResponse
from app.services.clearcut import (
    create_clearcut,
    get_clearcut,
    get_clearcut_by_id,
    get_clearcut_report,
    update_clearcut,
    update_clearcut_report,
)
from app.schemas.clearcut_report import (
    ClearCutReportBase,
    ClearCutReportResponse,
    ClearCutReportWithStrategy,
    ClearCutReportWithStrategyResponse,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clearcuts", tags=["Clearcuts"])
db_dependency = get_db_session()


@router.post("/", response_model=ClearCutResponse, status_code=201)
def create_new_clearcut(item: ClearCutCreate, db: Session = db_dependency) -> ClearCutResponse:
    logger.info(db)
    return create_clearcut(db, item)


@router.patch("/{id}", response_model=ClearCutResponse, status_code=201)
def update_existing_clearcut(
    id: int, item: ClearCutPatch, db: Session = db_dependency
) -> ClearCutResponse:
    logger.info(db)
    return update_clearcut(id, db, item)


@router.get("/", response_model=list[ClearCutResponse])
def list_clearcut(
    db: Session = db_dependency, skip: int = 0, limit: int = 10
) -> list[ClearCutResponse]:
    logger.info(db)
    return get_clearcut(db, skip=skip, limit=limit)


@router.get("/{id}/Report", response_model=ClearCutReportResponse)
def get_report_by_id(id: int, db: Session = db_dependency) -> ClearCutReportResponse:
    logger.info(db)
    return get_clearcut_report(db, id)


@router.put("/{id}/Report", response_model=ClearCutReportResponse)
def update_report(
    id: int, clearcutReportIn: ClearCutReportBase, db: Session = db_dependency
) -> ClearCutReportResponse:
    logger.info(db)
    return update_clearcut_report(db, id, clearcutReportIn)


@router.put("/{id}/ReportWithStrategy", response_model=ClearCutReportWithStrategyResponse)
def update_legal_strategy(
    id: int, clearcutReportIn: ClearCutReportWithStrategy, db: Session = db_dependency
) -> ClearCutReportWithStrategyResponse:
    logger.info(db)
    return update_clearcut_report(db, id, clearcutReportIn)


@router.get("/{id}", response_model=ClearCutResponse)
def get_by_id(id: int, db: Session = db_dependency) -> ClearCutResponse:
    logger.info(db)
    return get_clearcut_by_id(id, db)
