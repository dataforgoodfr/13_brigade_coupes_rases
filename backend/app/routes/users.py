from logging import getLogger

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.hateoas import PaginationResponseSchema
from app.schemas.user import (
    UserResponseSchema,
    UserUpdateSchema,
    user_to_user_response_schema,
)
from app.services.user import (
    create_user,
    delete_user_by_id,
    get_user_by_id,
    get_users,
    update_user,
)
from app.services.user_auth import get_admin_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.post(
    "/",
    status_code=201,
)
def create_new_user(
    response: Response,
    item: UserUpdateSchema,
    db=db_session,
    _=Depends(get_admin_user),
):
    logger.info(db)
    created_user = user_to_user_response_schema(create_user(db, item))
    response.headers["location"] = f"/api/v1/users/{created_user.id}"


@router.get(
    "/",
    response_model=PaginationResponseSchema[UserResponseSchema],
    response_model_exclude_none=True,
)
def list_users(
    db: Session = db_session,
    page: int = 0,
    size: int = 10,
    full_text_search: str = Query(default=None, alias="fullTextSearch"),
    email: str = None,
    login: str = None,
    first_name: str = Query(default=None, alias="firstName"),
    last_name: str = Query(default=None, alias="lastName"),
    roles: list[str] | None = Query(default=None),
    departments_ids: list[str] | None = Query(default=None, alias="departmentsIds"),
    asc_sort: list[str] | None = Query(default=[], alias="ascSort"),
    desc_sort: list[str] | None = Query(default=[], alias="descSort"),
    _=Depends(get_admin_user),
) -> PaginationResponseSchema[UserResponseSchema]:
    logger.info(db)
    return get_users(
        db,
        url="/api/v1/users",
        page=page,
        size=size,
        full_text_search=full_text_search,
        email=email,
        login=login,
        first_name=first_name,
        last_name=last_name,
        roles=roles,
        departments_ids=departments_ids,
        asc_sort=asc_sort,
        desc_sort=desc_sort,
    )


@router.get(
    "/{id}", response_model=UserResponseSchema, response_model_exclude_none=True
)
def get_user(id: int, db: Session = db_session) -> UserResponseSchema:
    logger.info(db)
    return get_user_by_id(id, db)


@router.delete(
    "/{id}",
    status_code=204,
)
def delete_user(id: int, db: Session = db_session):
    logger.info(db)
    return delete_user_by_id(id, db)


@router.put(
    "/{id}",
    status_code=204,
)
def update_existing_user(id: int, item: UserUpdateSchema, db: Session = db_session):
    logger.info(db)
    update_user(id, item, db)
