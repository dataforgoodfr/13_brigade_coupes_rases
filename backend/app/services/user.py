from logging import getLogger
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Department, User
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.schemas.user import UserCreateSchema, UserResponseSchema, UserUpdateSchema

logger = getLogger(__name__)


def user_to_user_response_schema(user: User) -> UserResponseSchema:
    return UserResponseSchema(
        id=str(user.id),
        deleted_at=user.deleted_at,
        created_at=user.created_at,
        role=user.role,
        updated_at=user.updated_at,
        firstname=user.firstname,
        lastname=user.lastname,
        login=user.login,
        email=user.email,
        departments=[str(department.id) for department in user.departments],
    )


def create_user(db: Session, user: UserCreateSchema) -> User:
    new_user = User(
        firstname=user.firstname,
        lastname=user.lastname,
        login=user.login,
        email=user.email,
        role=user.role,
    )
    for department_id in user.departments:
        department_db = (
            db.query(Department).filter(Department.id == department_id).first()
        )
        if department_db is None:
            raise HTTPException(
                status_code=404, detail=f"Item with id {department_db} not found"
            )
        new_user.departments.append(department_db)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_users(
    db: Session, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[UserResponseSchema]:
    users = db.query(User).offset(page * size).limit(size).all()
    users_count = db.query(User.id).count()
    return PaginationResponseSchema(
        metadata=PaginationMetadataSchema(
            page=page, size=size, url=url, total_count=users_count
        ),
        content=[user_to_user_response_schema(user) for user in users],
    )


def get_user_by_id(id: int, db: Session) -> UserResponseSchema:
    user = db.get(User, id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User {id} not found"
        )
    return user_to_user_response_schema(user)


def update_user(id: int, user_in: UserUpdateSchema, db: Session) -> User:
    user_db = db.get(User, id)
    if not user_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User {id} not found"
        )
    update_data = user_in.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if key == "departments":
            user_db.departments = []
            for department_id in value:
                department_db = (
                    db.query(Department).filter(Department.id == department_id).first()
                )
                if department_db is None:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Item with id {department_db} not found",
                    )
                user_db.departments.append(department_db)
        else:
            setattr(user_db, key, value)
    db.commit()
    db.refresh(user_db)
    return user_db

def delete_user(id: int, db: Session) -> None:
    user_db = get_user_by_id(id, db)
    db.delete(user_db)
    db.commit()
    return None


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter_by(email=email).first()
