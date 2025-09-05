from typing import Annotated

from fastapi import APIRouter, Depends, Header
from fastapi.security import OAuth2PasswordRequestForm
from pytest import Session

from app.common.errors import AppHTTPException
from app.database import get_db
from app.deps import db_session
from app.schemas.base import BaseSchema
from app.services.user import get_user_by_email
from app.services.user_auth import (
    Token,
    TokenSnakeCase,
    create_access_token,
    create_refresh_token,
    create_token,
    decode_token,
)

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
            access_token=token.access_token,
            token_type=token.token_type,
            refresh_token=token.refresh_token,
        )

    return create_token(db, user.username, user.password)


class RefreshTokenRequestSchema(BaseSchema):
    refresh_token: str


@router.post("/refresh")
def refresh_token(
    refresh_token: RefreshTokenRequestSchema, db: Session = Depends(get_db)
):
    decoded_token = decode_token(refresh_token.refresh_token, "email", type="refresh")
    if not decoded_token:
        raise AppHTTPException(
            status_code=401,
            detail="Invalid refresh token",
            type="INVALID_REFRESH_TOKEN",
        )
    user = get_user_by_email(db, decoded_token)
    if not user:
        raise AppHTTPException(
            status_code=401,
            type="USER_NOT_FOUND",
            detail=f"User {decoded_token} not found",
        )
    access_token = create_access_token(data={"sub": user.email})
    return Token(
        access_token=access_token,
        refresh_token=create_refresh_token(data={"email": user.email}),
        token_type="bearer",
    )
