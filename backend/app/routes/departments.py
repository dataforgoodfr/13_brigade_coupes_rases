from logging import getLogger

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.department import DepartmentResponseSchema
from app.schemas.hateoas import PaginationResponseSchema
from app.services.departement import find_departments

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/departments", tags=["Department"])


@router.get(
    "/",
    response_model=PaginationResponseSchema[DepartmentResponseSchema],
    response_model_exclude_none=True,
)
def list_departments(db: Session = db_session, page: int = 0, size: int = 10):
    logger.info(db)
    return find_departments(db, page=page, size=size, url="/api/v1/departments")
