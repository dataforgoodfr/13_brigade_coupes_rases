from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas.items import ItemCreate, ItemResponse
from app.services.items import create_item, get_items
from app.deps import get_db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])

