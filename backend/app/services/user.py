from http.client import HTTPException
from sqlalchemy.orm import Session
from app.models import Department, User
from app.schemas.user import UserCreate, UserUpdate
from logging import getLogger

logger = getLogger(__name__)


def create_user(db: Session, user: UserCreate):
    new_user = User(firstname=user.firstname, lastname=user.lastname, email=user.email)
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


def get_users(db: Session, skip: int = 0, limit: int = 10):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


def get_users_by_id(id: int, db: Session):
    user = db.get(User, id)
    return user


def update_user(id: int, user_in: UserUpdate, db: Session):
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
                        status_code=404, detail=f"Item with id {department_db} not found"
                    )
                user_db.departments.append(department_db)
        else:
            setattr(user_db, key, value)
    db.commit()
    db.refresh(user_db)
    return user_db
