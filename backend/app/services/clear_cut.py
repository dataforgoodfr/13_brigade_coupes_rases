from fastapi import HTTPException
from geoalchemy2.functions import ST_AsGeoJSON
from sqlalchemy.orm import Session

from app.models import ClearCut, ClearCutEcologicalZoning
from app.schemas.clear_cut import (
    ClearCutResponseSchema,
    clear_cut_to_clear_cut_response_schema,
)
from app.schemas.ecological_zoning import (
    ClearCutEcologicalZoningResponseSchema,
    clear_cut_ecological_zoning_to_clear_cut_ecological_zoning_response_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema


def map_geo_clearcut(clearcut: ClearCut, boundary: str, location: str) -> ClearCut:
    clearcut.boundary = boundary
    clearcut.location = location
    return clearcut


def get_clearcut_by_id(id: int, db: Session) -> ClearCutResponseSchema:
    result = (
        db.query(
            ClearCut,
            ST_AsGeoJSON(ClearCut.boundary),
            ST_AsGeoJSON(ClearCut.location),
        )
        .filter(ClearCut.id == id)
        .first()
    )
    if result is None:
        raise HTTPException(status_code=404, detail="ClearCut not found")
    clearcut: ClearCut
    boundary: str
    location: str
    clearcut, boundary, location = result
    return clear_cut_to_clear_cut_response_schema(
        map_geo_clearcut(clearcut, boundary, location)
    )


def paginated_clear_cuts_query(db: Session, page: int = 0, size: int = 10):
    return (
        db.query(
            ClearCut,
            ST_AsGeoJSON(ClearCut.boundary),
            ST_AsGeoJSON(ClearCut.location),
        )
        .offset(page * size)
        .limit(size)
    )


def clear_cuts_to_paginated_response(
    clear_cuts: list[ClearCut],
    clear_cuts_count: int,
    url: str,
    page: int,
    size: int,
):
    clear_cuts_response = map(
        lambda row: clear_cut_to_clear_cut_response_schema(
            map_geo_clearcut(row[0], row[1], row[2])
        ),
        clear_cuts,
    )
    return PaginationResponseSchema(
        content=list(clear_cuts_response),
        metadata=PaginationMetadataSchema.create(
            page=page, size=size, total_count=clear_cuts_count, url=url
        ),
    )


def find_clear_cuts(
    db: Session, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutResponseSchema]:
    clear_cuts = paginated_clear_cuts_query(db, page, size).all()
    clear_cuts_count = db.query(ClearCut.id).count()
    return clear_cuts_to_paginated_response(
        clear_cuts, clear_cuts_count, url, page, size
    )


def find_clearcuts_by_report(
    db: Session, report_id: int, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutResponseSchema]:
    clear_cuts = (
        paginated_clear_cuts_query(db, page, size)
        .filter(ClearCut.report_id == report_id)
        .all()
    )
    clear_cuts_count = (
        db.query(ClearCut.id).filter(ClearCut.report_id == report_id).count()
    )
    return clear_cuts_to_paginated_response(
        clear_cuts, clear_cuts_count, url, page, size
    )


def find_ecological_zonings_by_clear_cut(
    db: Session, clear_cut_id: int, url: str, page: int = 0, size: int = 10
) -> PaginationResponseSchema[ClearCutEcologicalZoningResponseSchema]:
    ecological_zonings = (
        db.query(ClearCutEcologicalZoning)
        .filter(ClearCutEcologicalZoning.clear_cut_id == clear_cut_id)
        .offset(page * size)
        .limit(size)
        .all()
    )
    ecological_zonings_count = (
        db.query(ClearCutEcologicalZoning.clear_cut_id)
        .filter(ClearCutEcologicalZoning.clear_cut_id == clear_cut_id)
        .count()
    )
    ecological_zonings_response = map(
        clear_cut_ecological_zoning_to_clear_cut_ecological_zoning_response_schema,
        ecological_zonings,
    )
    return PaginationResponseSchema(
        content=list(ecological_zonings_response),
        metadata=PaginationMetadataSchema.create(
            page=page, size=size, total_count=ecological_zonings_count, url=url
        ),
    )
