from app.services.departement import get_departments
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas.department import DepartmentResponse
from app.deps import db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/departments", tags=["Department"])


@router.get("/", response_model=list[DepartmentResponse])
def list_departments(db: Session = db_session, skip: int = 0, limit: int = 10):
    logger.info(db)
    return get_departments(db, skip=skip, limit=limit)
