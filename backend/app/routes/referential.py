from logging import getLogger

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.referential import ReferentialResponseSchema
from app.services.referential import get_referential as get_referential_response

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/referential", tags=["Referential"])


@router.get(
    "/",
    response_model=ReferentialResponseSchema,
    summary="Returns referential data",
    response_model_exclude_none=True,
)
def get_referential(db: Session = db_session):
    logger.info(db)
    return get_referential_response(db)
