from app.schemas.referential import ReferentialResponse
from app.services.referential import get_referential as get_referential_response
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.deps import get_db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/referential", tags=["Referential"])
db_dependency = get_db_session()


@router.get("/", response_model=ReferentialResponse, summary="Returns referential data")
def get_referential(db: Session = db_dependency):
    logger.info(db)
    x = []
    x.pop()
    return get_referential_response(db)
