from app.schemas.ecological_zoning import IdentifiedEcologicalZoningSchema
from app.schemas.hateoas import PaginationResponseSchema
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.deps import db_session
from logging import getLogger

from app.services.ecological_zoning import find_paginated_ecological_zonings

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/ecological-zonings", tags=["EcologicalZoning"])


@router.get("/", response_model=PaginationResponseSchema[IdentifiedEcologicalZoningSchema])
def list_ecological_zonings(db: Session = db_session, page: int = 0, size: int = 10):
    logger.info(db)
    return find_paginated_ecological_zonings(
        db,
        url="/api/v1/ecological-zonings",
        page=page,
        size=size,
    )
