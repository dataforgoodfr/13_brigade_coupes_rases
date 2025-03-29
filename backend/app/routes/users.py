from logging import getLogger

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.user import UserCreateSchema, UserResponseSchema, UserUpdateSchema
from app.services.user import (
    create_user,
    get_users,
    get_user_by_id,
    map_user,
    update_user,
)
from app.services.user_auth import get_admin_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.post("/", response_model=UserResponseSchema, status_code=201)
def create_new_user(
    item: UserCreateSchema,
    db=db_session,
    _=Depends(get_admin_user),
) -> UserResponseSchema:
    logger.info(db)
    return map_user(create_user(db, item))


@router.get("/", response_model=list[UserResponseSchema])
def list_users(
    db: Session = db_session, skip: int = 0, limit: int = 10, _=Depends(get_admin_user)
) -> list[UserResponseSchema]:
    logger.info(db)
    return [map_user(user) for user in get_users(db, skip=skip, limit=limit)]


@router.get("/{id}", response_model=UserResponseSchema)
def get_user(id: int, db: Session = db_session) -> UserResponseSchema:
    logger.info(db)
    return map_user(get_user_by_id(id, db))


@router.put("/{id}", response_model=UserResponseSchema, status_code=200)
def update_existing_user(id: int, item: UserUpdateSchema, db: Session = db_session) -> UserResponseSchema:
    logger.info(db)
    return map_user(update_user(id, item, db))
