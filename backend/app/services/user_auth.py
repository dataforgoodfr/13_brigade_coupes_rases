from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_snake
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.config import settings
from app.deps import db_session
from app.schemas.base import BaseSchema
from app.services.user import get_user_by_email


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user


SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
REFRESH_TOKEN_SECRET_KEY = settings.JWT_SECRET_KEY


class TokenSnakeCase(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str
    model_config = ConfigDict(
        alias_generator=to_snake,
        populate_by_name=True,
        from_attributes=True,
    )


class Token(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseSchema):
    email: str


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/token",
)
optional_oauth2_schema = OAuth2PasswordBearer(
    tokenUrl="/api/v1/token", auto_error=False
)


def verify_password(plain_password: str, hashed_password: str):
    password_byte_enc = plain_password.encode("utf-8")
    return bcrypt.checkpw(
        password=password_byte_enc,
        hashed_password=hashed_password.encode("utf-8"),
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_optional_current_user(
    db: Session = db_session, token=Depends(optional_oauth2_schema)
):
    if token is None:
        return None
    return get_current_user(db, token)


def get_current_user(db: Session = db_session, token=Depends(oauth2_scheme)):
    invalid_token = AppHTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        type="INVALID_TOKEN",
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise invalid_token
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise invalid_token from InvalidTokenError
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise AppHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            type="INVALID_CREDENTIALS",
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_admin_user(
    current_user=Depends(get_current_user),
):
    if current_user.role != "admin":
        raise AppHTTPException(
            status_code=403,
            type="INVALID_REQUESTER",
            detail="User should have admin role",
        )
    return current_user


def create_token(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)
    if not user:
        raise AppHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            type="INVALID_CREDENTIALS",
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return Token(
        access_token=access_token,
        refresh_token=create_refresh_token(data={"email": email}),
        token_type="bearer",
    )


def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, REFRESH_TOKEN_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(
    token: str, key: str | None = None, type: str = "access"
) -> str | None:
    try:
        if type == "refresh":
            payload = jwt.decode(
                token, REFRESH_TOKEN_SECRET_KEY, algorithms=[ALGORITHM]
            )
        else:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if key:
            return payload.get(key)
        return payload.get("sub")
    except jwt.PyJWTError as e:
        print(e)
        return None
