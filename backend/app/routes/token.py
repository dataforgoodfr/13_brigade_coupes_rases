from typing import Annotated

from fastapi import APIRouter, Depends, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.database import get_db
from app.deps import db_session
from app.schemas.base import BaseSchema
from app.services.user_auth import (
    Token,
    TokenSnakeCase,
    create_access_token,
    create_refresh_token,
    create_token,
    decode_token,
    get_active_user_by_email,
)

router = APIRouter(prefix="/api/v1/token", tags=["Token"])


@router.post(
    "/",
)
def generate_token(
    user: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = db_session,
    referer: Annotated[str | None, Header()] = None,
) -> Token | TokenSnakeCase:
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
) -> Token:
    decoded_token = decode_token(refresh_token.refresh_token, "email", type="refresh")
    if not decoded_token:
        raise AppHTTPException(
            status_code=401,
            detail="Invalid refresh token",
            type="INVALID_REFRESH_TOKEN",
        )
    user = get_active_user_by_email(db, decoded_token)
    access_token = create_access_token(data={"sub": user.email})
    return Token(
        access_token=access_token,
        refresh_token=create_refresh_token(data={"email": user.email}),
        token_type="bearer",
    )
