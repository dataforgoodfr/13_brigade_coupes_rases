from logging import getLogger

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, aliased

from app.models import Department, User, user_department
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.schemas.user import UserCreateSchema, UserResponseSchema, UserUpdateSchema
from app.services.get_password_hash import get_password_hash
from pydantic.alias_generators import to_snake

logger = getLogger(__name__)


def user_to_user_response_schema(user: User) -> UserResponseSchema:
    return UserResponseSchema(
        id=str(user.id),
        deleted_at=user.deleted_at,
        created_at=user.created_at,
        role=user.role,
        updated_at=user.updated_at,
        first_name=user.first_name,
        last_name=user.last_name,
        login=user.login,
        email=user.email,
        departments=[str(department.id) for department in user.departments],
    )


def create_user(db: Session, user: UserCreateSchema) -> User:
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        login=user.login,
        email=user.email,
        role=user.role,
        password=get_password_hash(user.password),
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
    db: Session,
    url: str,
    page: int,
    size: int,
    full_text_search:str,
    email: str,
    login: str,
    first_name: str,
    last_name: str,
    roles: list[str],
    departments_ids: list[str],
    asc_sort: list[str],
    desc_sort: list[str],
) -> PaginationResponseSchema[UserResponseSchema]:
    query = db.query(User)
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
        print(full_text_search)
        query = query.filter(User.search_vector.ilike(f"%{full_text_search}%"))
    
    if departments_ids is not None and len(departments_ids) > 0:
        matching_departments = (
            db.query(user_department)
            .filter(user_department.c.department_id.in_(departments_ids))
            .subquery()
        )
        aliased(user_department, matching_departments, name="matching_departments")
        query = query.join(matching_departments)
    users = query.offset(page * size).limit(size).all()
    users_count = db.query(User.id).count()
    return PaginationResponseSchema(
        metadata=PaginationMetadataSchema.create(
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


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter_by(email=email).first()
