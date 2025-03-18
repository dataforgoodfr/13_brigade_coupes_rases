import ast
from fastapi import HTTPException
from typing import List
from app.services.clearcut import (
    create_clearcut,
    get_clearcut,
    get_clearcut_preview,
    update_clearcut,
    get_clearcut_by_id,
)
from fastapi import APIRouter, Query
from sqlalchemy.orm import Session
from app.schemas.clearcut import (
    ClearCutCreate,
    ClearCutResponse,
    ClearCutPatch,
    ClearCutPreviews,
)
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


@router.get("/preview/", response_model=ClearCutPreviews)
def list_clearcut_preview(
    geobounds: str = Query(
        ...,
        description="List of tuples as a string, e.g., '[(43.3584, 5.3577), (43.3584, 5.3577)]'",
        example="[(5.507318, 43.352167), (5.283674, 43.192417)]",
    ),
    srid: int = Query(description="SRID code, EPSG:4326 for WGS 84", default=4326),
    db: Session = db_dependency,
) -> ClearCutPreviews:
    try:
        # Parse the string into a list of tuples
        geobounds_list = ast.literal_eval(geobounds)
        if not isinstance(geobounds_list, List) or not all(
            isinstance(item, tuple) for item in geobounds_list
        ):
            raise ValueError("Invalid geobounds format")

        clearcuts = get_clearcut_preview(db, geobounds_list, srid)

    except ValueError as err:
        raise HTTPException(
            status_code=400, detail="Invalid input format for geobounds"
        ) from err
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return clearcuts


@router.get("/{id}", response_model=ClearCutResponse)
def get_by_id(id: int, db: Session = db_dependency) -> ClearCutResponse:
    logger.info(db)
    return get_clearcut_by_id(id, db)
