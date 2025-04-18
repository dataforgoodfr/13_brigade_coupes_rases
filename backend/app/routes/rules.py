from app.schemas.referential import ReferentialResponseSchema
from app.services.referential import get_referential as get_referential_response
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.deps import db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/rules", tags=["Rules"])

