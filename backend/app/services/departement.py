from typing import Optional
from sqlalchemy.orm import Session
from app.models import Department
from logging import getLogger


logger = getLogger(__name__)


def get_departments(db: Session, skip: int = 0, limit: int = 10) -> list[Department]:
    departments = db.query(Department).offset(skip).limit(limit).all()
    return departments


def get_department_by_id(db: Session, id: int) -> Optional[Department]:
    return db.get(Department, id)
