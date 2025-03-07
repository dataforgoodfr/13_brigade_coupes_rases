from http.client import HTTPException
from sqlalchemy.orm import Session
from app.models import ClearCut
from app.schemas.clearcut import ClearCutCreate, ClearCutPatch
from logging import getLogger
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape

logger = getLogger(__name__)


def create_clearcut(db: Session, clearcut: ClearCutCreate):
    db_item = ClearCut(
        cut_date = clearcut.cut_date,
        slope_percentage = clearcut.slope_percentage,
        location=WKTElement(clearcut.location),
        boundary=WKTElement(clearcut.boundary),
        status = 'pending',
        department_id = clearcut.department_id
        )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db_item.location = to_shape(db_item.location).wkt
    db_item.boundary = to_shape(db_item.boundary).wkt
    return db_item

def update_clearcut(id: int, db: Session, clearcut_in: ClearCutPatch):
    clearcut = db.get(ClearCut, id)
    if not clearcut:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = clearcut_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(clearcut, key, value)
    db.commit()
    db.refresh(clearcut)
    clearcut.location = to_shape(clearcut.location).wkt
    clearcut.boundary = to_shape(clearcut.boundary).wkt
    return clearcut


def get_clearcut(db: Session, skip: int = 0, limit: int = 10):
    clearcuts = db.query(ClearCut).offset(skip).limit(limit).all()
    for clearcut in clearcuts:
        clearcut.location = to_shape(clearcut.location).wkt
        clearcut.boundary = to_shape(clearcut.boundary).wkt
    return clearcuts

def get_clearcut_by_id(id : int, db: Session):
    logger.info(f"Get clearcuts {id}")
    clearcut = db.get(ClearCut, id)
    clearcut.location = to_shape(clearcut.location).wkt
    clearcut.boundary = to_shape(clearcut.boundary).wkt
    return clearcut