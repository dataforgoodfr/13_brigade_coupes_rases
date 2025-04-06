from typing import Optional
from sqlalchemy.orm import Session
from app.models import Department
from logging import getLogger

from app.schemas.department import (
    department_to_department_base_response_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema


logger = getLogger(__name__)


def find_departments(db: Session, url: str, page: int = 0, size: int = 10) -> list[Department]:
    departments = db.query(Department).offset(page * size).limit(size).all()
    departments_count = db.query(Department.id).count()
    return PaginationResponseSchema(
        metadata=PaginationMetadataSchema(
            page=page, size=size, total_count=departments_count, url=url
        ),
        content=[
            department_to_department_base_response_schema(department)
            for department in departments
        ],
    )


def get_department_by_id(db: Session, id: int) -> Optional[Department]:
    return db.get(Department, id)


def get_department_by_code(db: Session, code: str) -> Optional[Department]:
    return db.query(Department).filter(Department.code == code).first()
