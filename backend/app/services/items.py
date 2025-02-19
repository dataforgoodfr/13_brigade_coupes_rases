from sqlalchemy.orm import Session
from app.models import Item
from app.schemas import ItemCreate
from logging import getLogger

logger = getLogger(__name__)


def create_item(db: Session, item: ItemCreate):
    logger.info(f"Creating item with name: {item.name}")
    db_item = Item(name=item.name, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_items(db: Session, skip: int = 0, limit: int = 10):
    logger.info("Get items called")
    return db.query(Item).offset(skip).limit(limit).all()
