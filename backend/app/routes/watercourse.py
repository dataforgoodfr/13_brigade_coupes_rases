from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.deps import get_db_session
from logging import getLogger
from app.services.watercourse import get_watercourses
from app.schemas.watercourse import WatercourseResponse

logger = getLogger(__name__)

router = APIRouter(prefix="/watercourse", tags=["Water course"])


@router.get("/", response_model=list[WatercourseResponse])
def list_watercourses(
    db: Session = get_db_session(),
    skip: int = 0,
    limit: int = 10):
    logger.info(db)
    return get_watercourses(db, skip=skip, limit=limit)
