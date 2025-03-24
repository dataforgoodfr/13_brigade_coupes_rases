from logging import getLogger
from fastapi import APIRouter, Depends, logger
from pytest import Session
from app.models import User
from app.schemas.user import UserResponse
from app.services.user import map_user
from app.services.user_auth import get_current_user
from app.deps import db_session

router = APIRouter(prefix="/api/v1/me", tags=["Me"])
logger = getLogger(__name__)


@router.get("/", response_model=UserResponse, status_code=200)
def get_me(
    db: Session = db_session, user: User = Depends(get_current_user)
) -> UserResponse:
    logger.info(db)
    return map_user(user)
