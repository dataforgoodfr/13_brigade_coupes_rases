from typing import Annotated

from fastapi import APIRouter, Depends, Header
from fastapi.security import OAuth2PasswordRequestForm

from app.deps import db_session
from app.services.user_auth import TokenSnakeCase, create_token

router = APIRouter(prefix="/api/v1/token", tags=["Token"])


@router.post(
    "/",
)
def generate_token(
    user: Annotated[OAuth2PasswordRequestForm, Depends()],
    db=db_session,
    referer: Annotated[str | None, Header()] = None,
):
    if referer is not None and referer.endswith("docs"):
        token = create_token(db, user.username, user.password)
        return TokenSnakeCase(
            access_token=token.access_token, token_type=token.token_type
        )
    return create_token(db, user.username, user.password)
