from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.deps import get_db_session
from logging import getLogger
from app.services.slope import get_slopes
from app.schemas.slope import SlopeResponse

logger = getLogger(__name__)

router = APIRouter(prefix="/slope", tags=["Slope"])

@router.get("/", response_model=list[SlopeResponse])
def list_slopes(
    db: Session = get_db_session(),
    skip: int = 0,
    limit: int = 10):
    logger.info(db)
    return get_slopes(db, skip=skip, limit=limit)