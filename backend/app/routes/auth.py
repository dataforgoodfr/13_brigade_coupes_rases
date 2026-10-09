from datetime import datetime

import jwt
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.deps import db_session
from app.models import User
from app.schemas.auth import ForgotPasswordSchema, RegisterSchema, ResetPasswordSchema
from app.schemas.user import UserResponseSchema, user_to_user_response_schema
from app.services.email import send_reset_password_email
from app.services.get_password_hash import get_password_hash
from app.services.user import reusable_account
from app.services.user_auth import (
    ALGORITHM,
    PASSWORD_TOKEN_LIFETIMES,
    SECRET_KEY,
    create_password_token,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponseSchema, status_code=201)
def register(user_data: RegisterSchema, db: Session = db_session) -> UserResponseSchema:
    new_user = reusable_account(db, user_data.email, user_data.login)
    new_user.first_name = user_data.first_name
    new_user.last_name = user_data.last_name
    new_user.email = user_data.email
    new_user.login = user_data.login
    new_user.password = get_password_hash(user_data.password)
    new_user.role = "volunteer"
    # An administrator validates the account first
    new_user.is_active = False
    new_user.created_at = datetime.now()
    new_user.updated_at = datetime.now()
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return user_to_user_response_schema(new_user)


@router.post("/forgot-password", status_code=200)
def forgot_password(
    data: ForgotPasswordSchema, db: Session = db_session
) -> dict[str, str]:
    user = (
        db.query(User)
        .filter(User.email == data.email, User.deleted_at.is_(None))
        .first()
    )
    if not user:
        # Don't reveal that user does not exist
        return {
            "message": "If this email is registered, a password reset link has been sent."
        }

    send_reset_password_email(user.email, create_password_token(user.email, "reset"))
    return {
        "message": "If this email is registered, a password reset link has been sent."
    }


@router.post("/reset-password", status_code=200)
def reset_password(
    data: ResetPasswordSchema, db: Session = db_session
) -> dict[str, str]:
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        # Also sets the first password of an account created by an admin
        if payload.get("type") not in PASSWORD_TOKEN_LIFETIMES:
            raise HTTPException(status_code=400, detail="Invalid token type")
        email = payload.get("sub")
    except jwt.ExpiredSignatureError as err:
        raise HTTPException(status_code=400, detail="Token has expired") from err
    except jwt.InvalidTokenError as err:
        raise HTTPException(status_code=400, detail="Invalid token") from err

    user = db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = get_password_hash(data.new_password)
    user.updated_at = datetime.now()
    db.commit()

    return {"message": "Password successfully reset."}
