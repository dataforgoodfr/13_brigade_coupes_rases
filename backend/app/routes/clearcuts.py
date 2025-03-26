from logging import getLogger

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.deps import get_db_session
from app.schemas.clearcut import ClearCutPatch, ClearCutResponse
from app.services.clearcut import (
    get_clearcut,
    get_clearcut_by_id,
    update_clearcut,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clearcuts", tags=["Clearcuts"])
db_dependency = get_db_session()


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


@router.get("/{id}", response_model=ClearCutResponse)
def get_by_id(id: int, db: Session = db_dependency) -> ClearCutResponse:
    logger.info(db)
    return get_clearcut_by_id(id, db)
