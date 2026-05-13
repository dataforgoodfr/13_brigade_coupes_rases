from datetime import datetime, timedelta

import jwt
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.deps import db_session
from app.models import User
from app.schemas.auth import ForgotPasswordSchema, RegisterSchema, ResetPasswordSchema
from app.schemas.user import UserResponseSchema, user_to_user_response_schema
from app.services.email import send_reset_password_email
from app.services.get_password_hash import get_password_hash
from app.services.user_auth import (
    ALGORITHM,
    SECRET_KEY,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponseSchema, status_code=201)
def register(user_data: RegisterSchema, db: Session = db_session):
    existing_user = (
        db.query(User)
        .filter((User.email == user_data.email) | (User.login == user_data.login))
        .first()
    )
    if existing_user and existing_user.deleted_at is None:
        raise AppHTTPException(
            status_code=409,
            type="USER_ALREADY_EXISTS",
            detail="A user already has the same login or the same email",
        )

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        login=user_data.login,
        password=get_password_hash(user_data.password),
        role="volunteer",  # default role
        is_active=False,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return user_to_user_response_schema(new_user)


@router.post("/forgot-password", status_code=200)
def forgot_password(data: ForgotPasswordSchema, db: Session = db_session):
    user = (
        db.query(User).filter(User.email == data.email, User.deleted_at is None).first()
    )
    if not user:
        # Don't reveal that user does not exist
        return {
            "message": "If this email is registered, a password reset link has been sent."
        }

    # Generate token valid for 1 hour
    expire = datetime.utcnow() + timedelta(hours=1)
    reset_token = jwt.encode(
        {"sub": user.email, "exp": expire, "type": "reset"},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    send_reset_password_email(user.email, reset_token)
    return {
        "message": "If this email is registered, a password reset link has been sent."
    }


@router.post("/reset-password", status_code=200)
def reset_password(data: ResetPasswordSchema, db: Session = db_session):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        email = payload.get("sub")
    except jwt.ExpiredSignatureError as err:
        raise HTTPException(status_code=400, detail="Token has expired") from err
    except jwt.InvalidTokenError as err:
        raise HTTPException(status_code=400, detail="Invalid token") from err

    user = db.query(User).filter(User.email == email, User.deleted_at is None).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = get_password_hash(data.new_password)
    user.updated_at = datetime.now()
    db.commit()

    return {"message": "Password successfully reset."}
