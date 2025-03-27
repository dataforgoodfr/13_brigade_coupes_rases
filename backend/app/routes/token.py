from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.deps import db_session
from app.services.user_auth import Token, create_token

router = APIRouter(prefix="/api/v1/token", tags=["Token"])


@router.post(
    "/",
    response_model=Token,
)
def generate_token(
    user: Annotated[OAuth2PasswordRequestForm, Depends()],
    db=db_session,
) -> Token:
    return create_token(db, user.username, user.password)
