from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.schemas.clearcut import ClearcutCreate
from logging import getLogger

from app.models.clearcut import Clearcut

logger = getLogger(__name__)

def create_clearcut(db: Session, item: ClearcutCreate):
    # logger.info(f"Creating item with name: {item.name}")
    raise HTTPException(status_code=501, detail="Not implemented yet.")
    db_clearcut = Clearcut(name=item.name, description=item.description)
    db.add(db_clearcut)
    db.commit()
    db.refresh(db_clearcut)
    return db_clearcut


def update_clearcut(db: Session, item: ClearcutCreate):
    logger.info(f"Creating item with name: {item.name}")
    raise HTTPException(status_code=501, detail="Not implemented yet.")
    return db_item


def get_clearcut(db: Session, skip: int = 0, limit: int = 10):
    logger.info("Get items called")
    raise HTTPException(status_code=501, detail="Not implemented yet.")
    return db.query(Item).offset(skip).limit(limit).all()
