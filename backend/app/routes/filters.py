from logging import getLogger

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.models import User
from app.schemas.filters import FiltersResponseSchema
from app.services.filters import build_filters
from app.services.user_auth import get_optional_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/filters", tags=["Filters"])


@router.get("/", response_model=FiltersResponseSchema)
def get_filters(
    db: Session = db_session, user: User = Depends(get_optional_current_user)
) -> FiltersResponseSchema:
    logger.info(db)
    return build_filters(db, user)
