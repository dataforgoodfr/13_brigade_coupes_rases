from fastapi import APIRouter, Depends
from pytest import Session

from app.models import User
from app.schemas.user import (
    MeResponseSchema,
    MeUpdateSchema,
    user_to_me_response_schema,
    user_to_user_response_schema,
)
from app.services.user import update_me
from app.services.user_auth import get_current_user
from app.deps import db_session

router = APIRouter(prefix="/api/v1/me", tags=["Me"])


@router.get(
    "/",
    response_model=MeResponseSchema,
    status_code=200,
    response_model_exclude_none=True,
)
def get_me(user: User = Depends(get_current_user)) -> MeResponseSchema:
    return user_to_me_response_schema(user)


@router.put(
    "/",
    status_code=204,
)
def put_me(
    request: MeUpdateSchema, db: Session = db_session, user: User = Depends(get_current_user)
) -> None:
    return update_me(db, user, request)
