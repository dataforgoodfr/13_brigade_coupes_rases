from app.services.departement import get_departments
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas.department import DepartmentResponse
from app.deps import get_db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/departement", tags=["Department"])
db_dependency = get_db_session()


@router.get("/", response_model=list[DepartmentResponse])
def list_departments(db: Session = db_dependency, skip: int = 0, limit: int = 10):
    logger.info(db)
    return get_departments(db, skip=skip, limit=limit)
