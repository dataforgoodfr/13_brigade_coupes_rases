from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import CLEAR_CUT_PREVIEW_COLUMNS, ClearCut
from app.schemas.clearcut import (
    ClearCutCreate,
    ClearCutPatch,
    ClearCutPreview,
    ClearCutPreviews,
)
from logging import getLogger
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from geoalchemy2.functions import ST_Contains, ST_MakeEnvelope


logger = getLogger(__name__)
_sridDatabase = 4326


def create_clearcut(db: Session, clearcut: ClearCutCreate):
    db_item = ClearCut(
        cut_date=clearcut.cut_date,
        slope_percentage=clearcut.slope_percentage,
        location=WKTElement(clearcut.location),
        boundary=WKTElement(clearcut.boundary),
        status="pending",
        department_id=clearcut.department_id,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db_item.location = to_shape(db_item.location, srid=_sridDatabase).wkt
    db_item.boundary = to_shape(db_item.boundary, srid=_sridDatabase).wkt
    return db_item


def update_clearcut(id: int, db: Session, clearcut_in: ClearCutPatch):
    clearcut = db.get(ClearCut, id)
    if not clearcut:
        raise HTTPException(status_code=404, detail="ClearCut not found")
    update_data = clearcut_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(clearcut, key, value)
    db.commit()
    db.refresh(clearcut)
    clearcut.location = to_shape(clearcut.location, srid=_sridDatabase).wkt
    clearcut.boundary = to_shape(clearcut.boundary, srid=_sridDatabase).wkt
    return clearcut


def get_clearcut(db: Session, skip: int = 0, limit: int = 10):
    clearcuts = db.query(ClearCut).offset(skip).limit(limit).all()
    for clearcut in clearcuts:
        clearcut.location = to_shape(clearcut.location)
        clearcut.boundary = to_shape(clearcut.boundary)

        clearcut.location = clearcut.location.coords[0]
        clearcut.boundary = list(clearcut.boundary.exterior.coords)
    return clearcuts


def get_clearcut_by_id(id: int, db: Session):
    clearcut = db.get(ClearCut, id)
    clearcut.location = to_shape(clearcut.location)
    clearcut.boundary = to_shape(clearcut.boundary)

    clearcut.location = clearcut.location.coords[0]
    clearcut.boundary = list(clearcut.boundary.exterior.coords)
    return clearcut


def get_clearcut_preview(
    db: Session,
    swLon: float,
    swLat: float,
    neLon: float,
    neLat: float,
    skip: int = 0,
    limit: int = 10,
):
    # Define area in database srid
    square = ST_MakeEnvelope(swLon, swLat, neLon, neLat, _sridDatabase)

    # Get location for all clearcuts located in the requested area
    locations = db.query(ClearCut.location).filter(ST_Contains(square, ClearCut.location)).all()
    locations = [to_shape(location[0]).coords[0] for location in locations]

    # Get preview for the x most relevant clearcut
    previews = (
        db.query(*CLEAR_CUT_PREVIEW_COLUMNS)
        .filter(ST_Contains(square, ClearCut.location))
        .order_by(ClearCut.created_at)
        .offset(skip)
        .limit(limit)
        .all()
    )
    previews = [
        ClearCutPreview(
            location=to_shape(preview[0]).coords[0],
            boundary=list(to_shape(preview[1]).exterior.coords),
            slope_percentage=preview[2],
            department_id=preview[3],
            cut_date=preview[4],
        )
        for preview in previews
    ]

    clearcutPreview = ClearCutPreviews(location=locations, previews=previews)
    return clearcutPreview
