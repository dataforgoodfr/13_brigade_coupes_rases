from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.deps import get_db_session
from logging import getLogger

from app.services.ecologicalZone import get_ecological_zone
from app.schemas.ecologicalZone import EcologicalZoneResponse

logger = getLogger(__name__)

router = APIRouter(prefix="/ecologicalZone", tags=["Ecological zone"])

@router.get("/", response_model=list[EcologicalZoneResponse])
def list_ecological_zonings(
    db: Session = get_db_session(),
    skip: int = 0,
    limit: int = 10):
    logger.info(db)
    return get_ecological_zone(db, skip=skip, limit=limit)