from logging import getLogger

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.hateoas import PaginationResponseSchema
from app.schemas.user import UserCreateSchema, UserResponseSchema, UserUpdateSchema
from app.services.user import (
    create_user,
    get_user_by_id,
    get_users,
    update_user,
    user_to_user_response_schema,
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
    return user_to_user_response_schema(create_user(db, item))


@router.get("/", response_model=PaginationResponseSchema[UserResponseSchema])
def list_users(
    db: Session = db_session, page: int = 0, size: int = 10, _=Depends(get_admin_user)
) -> PaginationResponseSchema[UserResponseSchema]:
    logger.info(db)
    return get_users(db, url="/api/v1/users", page=page, size=size)


@router.get("/{id}", response_model=UserResponseSchema)
def get_user(id: int, db: Session = db_session) -> UserResponseSchema:
    logger.info(db)
    return user_to_user_response_schema(get_user_by_id(id, db))


@router.put("/{id}", response_model=UserResponseSchema, status_code=200)
def update_existing_user(
    id: int, item: UserUpdateSchema, db: Session = db_session
) -> UserResponseSchema:
    logger.info(db)
    return user_to_user_response_schema(update_user(id, item, db))
