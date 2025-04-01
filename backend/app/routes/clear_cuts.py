from logging import getLogger

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.clear_cut_map import ClearCutMapResponseSchema
from app.schemas.ecological_zoning import EcologicalZoningResponseSchema
from app.schemas.hateoas import PaginationResponseSchema
from app.services.clear_cut import find_ecological_zonings_by_clear_cut
from app.services.clear_cut_report import (
    GeoBounds,
    build_clearcuts_map,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts", tags=["Clearcuts"])


@router.get(
    "/{clear_cut_id}/ecological-zonings",
    response_model=PaginationResponseSchema[EcologicalZoningResponseSchema],
)
def list_clearcuts_reports(
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
