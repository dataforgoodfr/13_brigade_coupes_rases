from app.models.ecologicalZone import EcologicalZone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from logging import getLogger


logger = getLogger(__name__)


def get_ecological_zone(db: Session, skip: int = 0, limit: int = 10):
    logger.info("Get items called")
    raise HTTPException(status_code=501, detail="Not implemented yet.")
    return db.query(EcologicalZone).offset(skip).limit(limit).all()