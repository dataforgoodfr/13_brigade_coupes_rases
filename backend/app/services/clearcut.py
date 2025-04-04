from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, aliased
from app.models import CLEAR_CUT_PREVIEW_COLUMNS, ClearCut, ClearCutReport
from app.schemas.clearcut import (
    ClearCutCreate,
    ClearCutPatch,
)
from logging import getLogger
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from geoalchemy2.functions import ST_Contains, ST_MakeEnvelope, ST_SetSRID

from app.schemas.clearcut_map import ClearCutPreview, ClearCutMapResponse


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


def get_clearcut_report(db: Session, id: int):
    # clearcut = db.query(ClearCut).options(
    #     joinedload(ClearCut.clear_cut_report)  # Charge les rapports en jointure
    # ).get(id)

    # print(clearcut.clear_cut_report.forest_description)

    # clearcut.location = to_shape(clearcut.location)
    # clearcut.boundary = to_shape(clearcut.boundary)

    # clearcut.location = clearcut.location.coords[0]
    # clearcut.boundary = list(clearcut.boundary.exterior.coords)
    # return clearcut

    clearcut_report_alias = aliased(ClearCutReport)

    # Récupère toutes les colonnes des deux tables de façon dynamique
    clearcut_columns = [getattr(ClearCut, col.name) for col in ClearCut.__table__.columns]
    report_columns = [
        getattr(clearcut_report_alias, col.name)
        for col in ClearCutReport.__table__.columns
        if col.name != "id"
    ]
    columns = [*clearcut_columns, *report_columns]

    result = (
        db.query(*columns)  # Décompose les listes en arguments
        .select_from(ClearCut)
        .outerjoin(clearcut_report_alias, ClearCut.id == clearcut_report_alias.clear_cut_id)
        .filter(ClearCut.id == id)
        .first()
    )
    # x = dict(clearcut._mapping) if clearcut else None
    data = dict(result._mapping)  # Convertit le résultat SQLAlchemy en dictionnaire

    # Séparer les données pour ClearCut et ClearCutReport
    clearcut_data_report = {}
    for col in ClearCut.__table__.columns:
        clearcut_data_report[col.name] = data[col.name]

    for col in ClearCutReport.__table__.columns:
        if data[col.name] is not None:
            clearcut_data_report[col.name] = data[col.name]

    clearcut_data_report["location"] = to_shape(clearcut_data_report["location"])
    clearcut_data_report["boundary"] = to_shape(clearcut_data_report["boundary"])

    clearcut_data_report["location"] = clearcut_data_report["location"].coords[0]
    clearcut_data_report["boundary"] = list(clearcut_data_report["boundary"].exterior.coords)

    print(clearcut_data_report)
    return clearcut_data_report


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
