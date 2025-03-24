from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models import CLEAR_CUT_PREVIEW_COLUMNS, ClearCut, Department
from app.schemas.clearcut import (
    ClearCutCreate,
    ClearCutPatch,
)
from logging import getLogger
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape, from_shape
from shapely.geometry import Point, MultiPolygon
from geoalchemy2.functions import ST_Contains, ST_MakeEnvelope, ST_SetSRID

from app.schemas.clearcut_map import ClearCutPreview, ClearCutMapResponse


logger = getLogger(__name__)
_sridDatabase = 4326


def create_clearcut(db: Session, clearcut: ClearCutCreate):
    department = (
        db.query(Department).filter(Department.code == clearcut.department_code).first()
    )
    if not department:
        raise ValueError(f"Department with code {clearcut.department_code} not found")

    intersecting_clearcut = (
        db.query(ClearCut)
        .filter(
            ClearCut.boundary.ST_Intersects(
                from_shape(MultiPolygon(clearcut.boundary), srid=4326)
            )
        )
        .first()
    )

    if intersecting_clearcut:
        raise ValueError(
            f"New clearcut boundary intersects with existing clearcut ID {intersecting_clearcut.id}"
        )

    db_item = ClearCut(
        cut_date=clearcut.cut_date,
        slope_percentage=clearcut.slope_percentage,
        location=from_shape(Point(clearcut.location)),
        boundary=from_shape(MultiPolygon(clearcut.boundary)),
        status=ClearCut.Status.PENDING,
        department_id=department.id,
        address=clearcut.address,
        name_natura=clearcut.name_natura,
        number_natura=clearcut.number_natura,
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


class GeoBounds(BaseModel):
    south_west_latitude: float
    south_west_longitude: float
    north_east_latitude: float
    north_east_longitude: float


def get_clearcuts_map(db: Session, geo_bounds: GeoBounds):
    envelope = ST_MakeEnvelope(
        geo_bounds.south_west_longitude,
        geo_bounds.south_west_latitude,
        geo_bounds.north_east_longitude,
        geo_bounds.north_east_latitude,
        _sridDatabase,
    )
    square = ST_SetSRID(envelope, _sridDatabase)
    points = db.query(ClearCut.location).filter(ST_Contains(square, ClearCut.location)).all()
    points = [to_shape(location[0]).coords[0] for location in points]

    # Get preview for the x most relevant clearcut
    previews = (
        db.query(*CLEAR_CUT_PREVIEW_COLUMNS)
        .filter(ST_Contains(square, ClearCut.location))
        .order_by(ClearCut.created_at)
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

    map_response = ClearCutMapResponse(points=points, previews=previews)
    return map_response


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

    clearcutPreview = ClearCutMapResponse(points=locations, previews=previews)
    return clearcutPreview
