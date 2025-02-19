from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas import ItemCreate, ItemResponse
from app.services.items import create_item, get_items
from app.deps import get_db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/items", tags=["Items"])
db_dependency = get_db_session()


@router.post("/", response_model=ItemResponse, status_code=201)
def create_new_item(item: ItemCreate, db: Session = db_dependency) -> ItemResponse:
    logger.info(db)
    return create_item(db, item)


@router.get("/", response_model=list[ItemResponse])
def list_items(db: Session = db_dependency, skip: int = 0, limit: int = 10):
    logger.info(db)
    return get_items(db, skip=skip, limit=limit)
