from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.config import Settings
from app.deps import db_session
from app.schemas.clearcut import ClearCutCreate, ClearCutPatch, ClearCutResponse, ImportsClearCutResponse
from app.services.clearcut import (
    create_clearcut,
    get_clearcut,
    get_clearcut_by_id,
    update_clearcut,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clearcuts", tags=["Clearcuts"])


def authenticate(x_imports_token: str = Header(default="")):
    if x_imports_token != Settings.IMPORTS_TOKEN or x_imports_token == "":
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post(
    "/", response_model=ImportsClearCutResponse, dependencies=[Depends(authenticate)]
)
def post_clearcut(params: ClearCutCreate, db: Session = db_session):
    try:
        clearcut = create_clearcut(db, params)

        clearcut.department_code = clearcut.department.code

        return clearcut
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

@router.patch("/{id}", response_model=ClearCutResponse, status_code=201)
def update_existing_clearcut(
    id: int, item: ClearCutPatch, db: Session = db_session
) -> ClearCutResponse:
    logger.info(db)
    return update_clearcut(id, db, item)


@router.get("/", response_model=list[ClearCutResponse])
def list_clearcut(
    db: Session = db_session, skip: int = 0, limit: int = 10
) -> list[ClearCutResponse]:
    logger.info(db)
    return get_clearcut(db, skip=skip, limit=limit)


@router.get("/{id}", response_model=ClearCutResponse)
def get_by_id(id: int, db: Session = db_session) -> ClearCutResponse:
    logger.info(db)
    return get_clearcut_by_id(id, db)
