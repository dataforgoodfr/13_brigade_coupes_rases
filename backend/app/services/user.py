from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Department, User
from app.schemas.user import UserCreateSchema, UserResponseSchema, UserUpdateSchema
from logging import getLogger

logger = getLogger(__name__)


def map_user(user: User) -> UserResponseSchema:
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
        department_db = db.query(Department).filter(Department.id == department_id).first()
        if department_db is None:
            raise HTTPException(
                status_code=404, detail=f"Item with id {department_db} not found"
            )
        new_user.departments.append(department_db)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_users(db: Session, skip: int = 0, limit: int = 10) -> list[User]:
    users = db.query(User).offset(skip).limit(limit).all()
    return users


def get_user_by_id(id: int, db: Session) -> Optional[User]:
    user = db.get(User, id)
    return user


def update_user(id: int, user_in: UserUpdateSchema, db: Session) -> User:
    user_db = db.get(User, id)
    if not user_db:
        raise HTTPException(status_code=404, detail="user not found")
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


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter_by(email=email).first()
