from http.client import HTTPException
from sqlalchemy.orm import Session
from app.models import Department, User
from app.schemas.user import UserCreate
from logging import getLogger

logger = getLogger(__name__)


def create_user(db: Session, user: UserCreate):
    logger.info(f"Creating item with name: ")
    new_user = User(
        firstname = user.firstname,
        lastname = user.lastname,
        email = user.email
        )
    for department_id in user.departments:
        department_db = db.query(Department).filter(Department.id == department_id).first()
        if department_db is None:
            raise HTTPException(status_code=404, detail=f"Item with id {department_db} not found")
        new_user.departments.append(department_db)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_users(db: Session, skip: int = 0, limit: int = 10):
    logger.info("Get items called")
    users = db.query(User).offset(skip).limit(limit).all()
    return users
