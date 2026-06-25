from logging import getLogger

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.models import User
from app.schemas.clear_cut import ClearCutPatchSchema, ClearCutResponseSchema
from app.schemas.ecological_zoning import (
    ClearCutEcologicalZoningResponseSchema,
)
from app.schemas.hateoas import PaginationResponseSchema
from app.services.clear_cut import (
    find_clear_cuts,
    find_ecological_zonings_by_clear_cut,
    get_clearcut_by_id,
    update_clear_cut_geometry,
)
from app.services.user_auth import get_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts", tags=["Clearcuts"])


@router.get(
    "/{clear_cut_id}/ecological-zonings",
    response_model=PaginationResponseSchema[ClearCutEcologicalZoningResponseSchema],
    response_model_exclude_none=True,
)
def list_ecological_zonings(
    clear_cut_id: int, db: Session = db_session, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutEcologicalZoningResponseSchema]:
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
    response_model_exclude_none=True,
)
def get_clear_cut(
    clear_cut_id: int, db: Session = db_session
) -> ClearCutResponseSchema:
    logger.info(db)
    return get_clearcut_by_id(id=clear_cut_id, db=db)


@router.patch(
    "/{clear_cut_id}",
    response_model=ClearCutResponseSchema,
    response_model_exclude_none=True,
)
def patch_clear_cut(
    clear_cut_id: int,
    item: ClearCutPatchSchema,
    db: Session = db_session,
    user: User = Depends(get_current_user),
) -> ClearCutResponseSchema:
    """Manually correct a clear cut's perimeter and/or observation dates."""
    logger.info(db)
    return update_clear_cut_geometry(db, clear_cut_id, user, item)


@router.get(
    "/",
    response_model=PaginationResponseSchema[ClearCutResponseSchema],
    response_model_exclude_none=True,
)
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
