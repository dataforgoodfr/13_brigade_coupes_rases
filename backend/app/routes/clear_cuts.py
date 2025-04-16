from logging import getLogger

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.clear_cut import ClearCutResponseSchema
from app.schemas.ecological_zoning import EcologicalZoningResponseSchema
from app.schemas.hateoas import PaginationResponseSchema
from app.services.clear_cut import (
    find_ecological_zonings_by_clear_cut,
    get_clearcut_by_id,
    find_clear_cuts,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts", tags=["Clearcuts"])


@router.get(
    "/{clear_cut_id}/ecological-zonings",
    response_model=PaginationResponseSchema[EcologicalZoningResponseSchema],
)
def list_clear_cuts_reports(
    clear_cut_id: int, db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[EcologicalZoningResponseSchema]:
    logger.info(db)
    return find_ecological_zonings_by_clear_cut(
        db,
        clear_cut_id=clear_cut_id,
        url=f"/api/v1/clear-cuts/{clear_cut_id}/ecological-zonings",
        page=page,
        size=size,
    )


@router.get(
    "/{clear_cut_id}",
    response_model=ClearCutResponseSchema,
)
def get_clear_cut(clear_cut_id: int, db: Session = db_session) -> ClearCutResponseSchema:
    logger.info(db)
    return get_clearcut_by_id(id=clear_cut_id, db=db)


@router.get("/", response_model=PaginationResponseSchema[ClearCutResponseSchema])
def list_clear_cuts(
    db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutResponseSchema]:
    logger.info(db)
    return find_clear_cuts(
        db,
        url="/api/v1/clear-cuts",
        page=page,
        size=size,
    )
