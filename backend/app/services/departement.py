from typing import Optional
from sqlalchemy.orm import Session
from app.models import Department
from logging import getLogger

from app.schemas.department import department_to_department_base_response_schema, department_to_department_base_schema


logger = getLogger(__name__)


def find_departments(db: Session, skip: int = 0, limit: int = 10) -> list[Department]:
    departments = db.query(Department).offset(skip).limit(limit).all()
    return [
        department_to_department_base_response_schema(department) for department in departments
    ]


def get_department_by_id(db: Session, id: int) -> Optional[Department]:
    return db.get(Department, id)


def get_department_by_code(db: Session, code: str) -> Optional[Department]:
    return db.query(Department).filter(Department.code == code).first()
