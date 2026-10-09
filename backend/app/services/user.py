import secrets
from datetime import datetime
from logging import getLogger

from fastapi import status
from pydantic.alias_generators import to_snake
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.models import ClearCutReport, Department, User, user_department
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.schemas.user import (
    MeUpdateSchema,
    UserResponseSchema,
    UserUpdateSchema,
    user_to_user_response_schema,
)
from app.services.email import send_account_activated_email
from app.services.get_password_hash import get_password_hash

logger = getLogger(__name__)


def reusable_account(db: Session, email: str, login: str) -> User:
    """A blank account for this email and login.

    Email and login stay unique once an account is deleted: the deleted
    account holding them is taken over, without its former departments.
    """
    holders = db.query(User).filter(or_(User.email == email, User.login == login)).all()
    # Two deleted accounts would each keep one of the two values
    if any(holder.deleted_at is None for holder in holders) or len(holders) > 1:
        raise AppHTTPException(
            status_code=409,
            type="USER_ALREADY_EXISTS",
            detail="A user already has the same login or the same email",
        )
    if not holders:
        return User()
    account = holders[0]
    account.deleted_at = None
    account.departments = []
    return account


def create_user(db: Session, user: UserUpdateSchema) -> User:
    new_user = reusable_account(db, user.email, user.login)
    password = secrets.token_urlsafe(10)
    new_user.created_at = datetime.now()
    new_user.updated_at = datetime.now()
    new_user.first_name = user.first_name
    new_user.last_name = user.last_name
    new_user.login = user.login
    new_user.email = user.email
    new_user.role = user.role
    new_user.is_active = user.is_active
    # Nobody knows this password: the route emails a link to choose one
    new_user.password = get_password_hash(password)

    for department_id in user.departments:
        department_db = (
            db.query(Department).filter(Department.id == int(department_id)).first()
        )
        if department_db is None:
            raise AppHTTPException(
                status_code=404,
                type="DEPARTMENT_NOT_FOUND",
                detail=f"Department with id {department_db} not found",
            )
        new_user.departments.append(department_db)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_users(
    db: Session,
    url: str,
    page: int,
    size: int,
    full_text_search: str | None,
    email: str | None,
    login: str | None,
    first_name: str | None,
    last_name: str | None,
    roles: list[str] | None,
    departments_ids: list[str] | None,
    asc_sort: list[str],
    desc_sort: list[str],
) -> PaginationResponseSchema[UserResponseSchema]:
    query = db.query(User).filter(User.deleted_at.__eq__(None))
    for sort in asc_sort:
        query = query.order_by(User.__table__.c[to_snake(sort)])
    for sort in desc_sort:
        query = query.order_by(User.__table__.c[to_snake(sort)].desc())
    if email is not None:
        query = query = query.filter(User.email.ilike(f"%{email}%"))
    if login is not None:
        query = query.filter(User.login.ilike(f"%{login}%"))
    if first_name is not None:
        query = query.filter(User.first_name.ilike(f"%{first_name}%"))
    if last_name is not None:
        query = query.filter(User.last_name.ilike(f"%{last_name}%"))
    if roles is not None:
        query = query.filter(User.role.in_(roles))
    if full_text_search is not None:
        # Every word must appear: "camille hêtre" finds Camille Hêtre
        for word in full_text_search.split():
            query = query.filter(User.search_vector.ilike(f"%{word}%"))

    if departments_ids is not None and len(departments_ids) > 0:
        matching_departments = (
            db.query(user_department)
            .filter(user_department.c.department_id.in_(map(int, departments_ids)))
            .subquery()
        )
        query = query.join(matching_departments)
    users = query.offset(page * size).limit(size).all()
    users_count = query.count()
    return PaginationResponseSchema(
        metadata=PaginationMetadataSchema.create(
            page=page, size=size, url=url, total_count=users_count
        ),
        content=[user_to_user_response_schema(user) for user in users],
    )


def get_user_by_id(id: int, db: Session) -> UserResponseSchema:
    user = db.get(User, id)
    if user is None or user.deleted_at is not None:
        raise AppHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            type="USER_NOT_FOUND",
            detail=f"User {id} not found",
        )
    return user_to_user_response_schema(user)


def delete_user_by_id(id: int, db: Session) -> None:
    user = db.get(User, id)
    if user is None or user.deleted_at is not None:
        raise AppHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            type="USER_NOT_FOUND",
            detail=f"User {id} not found",
        )
    user.deleted_at = datetime.now()
    db.commit()


def update_user(id: int, user_in: UserUpdateSchema, db: Session) -> User:
    user_db = db.get(User, id)
    if user_db is None or user_db.deleted_at is not None:
        raise AppHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            type="USER_NOT_FOUND",
            detail=f"User {id} not found",
        )
    user_db.updated_at = datetime.now()
    was_active = user_db.is_active
    update_data = user_in.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == "departments":
            user_db.departments = []
            for department_id in value:
                department_db = (
                    db.query(Department)
                    .filter(Department.id == int(department_id))
                    .first()
                )
                if department_db is None:
                    raise AppHTTPException(
                        status_code=404,
                        type="DEPARTMENT_NOT_FOUND",
                        detail=f"Item with id {department_db} not found",
                    )
                user_db.departments.append(department_db)
        else:
            setattr(user_db, key, value)
    db.commit()
    db.refresh(user_db)
    if user_db.is_active and not was_active:
        send_account_activated_email(user_db.email)
    return user_db


def get_user_by_email(db: Session, email: str) -> User | None:
    """Deleted accounts are ignored."""
    email = email.strip()
    return db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()


def update_me(db: Session, user: User, request: MeUpdateSchema) -> None:
    user.favorites = (
        db.query(ClearCutReport)
        .filter(ClearCutReport.id.in_(map(int, request.favorites)))
        .all()
    )
    db.commit()
