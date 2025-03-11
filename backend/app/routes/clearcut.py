from app.services.clearcut import (
    create_clearcut,
    get_clearcut,
    update_clearcut,
    get_clearcut_by_id,
)
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas.clearcut import ClearCutCreate, ClearCutResponse, ClearCutPatch
from app.deps import get_db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/clearcut", tags=["Clearcut"])
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


@router.get("/{id}", response_model=ClearCutResponse)
def get_by_id(id: int, db: Session = db_dependency) -> ClearCutResponse:
    logger.info(db)
    return get_clearcut_by_id(id, db)
