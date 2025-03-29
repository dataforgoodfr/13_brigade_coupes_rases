from app.services.departement import find_departments
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas.department import DepartmentResponseSchema
from app.deps import db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/departments", tags=["Department"])


@router.get("/", response_model=list[DepartmentResponseSchema])
def list_departments(db: Session = db_session, skip: int = 0, limit: int = 10):
    logger.info(db)
    return find_departments(db, skip=skip, limit=limit)
