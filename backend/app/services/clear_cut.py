from collections.abc import Sequence
from datetime import datetime

from geoalchemy2 import Geography
from geoalchemy2.functions import ST_Area, ST_AsGeoJSON, ST_Centroid
from shapely.geometry import shape
from sqlalchemy import Row, cast, func, update
from sqlalchemy.orm import Session
from sqlalchemy.orm.query import RowReturningQuery

from app.common.errors import AppHTTPException
from app.models import SRID, ClearCut, ClearCutEcologicalZoning, User
from app.schemas.clear_cut import (
    ClearCutPatchSchema,
    ClearCutResponseSchema,
    clear_cut_to_clear_cut_response_schema,
)
from app.schemas.ecological_zoning import (
    ClearCutEcologicalZoningResponseSchema,
    clear_cut_ecological_zoning_to_clear_cut_ecological_zoning_response_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.services.clear_cut_report import sync_clear_cuts_reports


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
        raise AppHTTPException(
            status_code=404, type="CLEAR_CUT_NOT_FOUND", detail="ClearCut not found"
        )
    clearcut: ClearCut
    boundary: str
    location: str
    clearcut, boundary, location = result
    return clear_cut_to_clear_cut_response_schema(
        map_geo_clearcut(clearcut, boundary, location)
    )


def update_clear_cut_geometry(
    db: Session,
    clear_cut_id: int,
    connected_user: User,
    request: ClearCutPatchSchema,
) -> ClearCutResponseSchema:
    """Manually correct a clear cut's perimeter and/or observation dates.

    Allowed for admins and the volunteer assigned to the parent report. Editing
    the perimeter recomputes the area (hectares) and centroid server-side from
    PostGIS, flags the cut as manually edited, and re-aggregates the report.
    """
    clear_cut = db.get(ClearCut, clear_cut_id)
    if clear_cut is None:
        raise AppHTTPException(
            status_code=404, type="CLEAR_CUT_NOT_FOUND", detail="ClearCut not found"
        )

    report = clear_cut.report
    if connected_user.role != "admin" and (
        report is None or report.user_id != connected_user.id
    ):
        raise AppHTTPException(
            status_code=403,
            type="INVALID_REQUESTER_RIGHTS",
            detail="Only admins or the assigned volunteer can edit a clear cut",
        )

    changed = False
    if request.observation_start_date is not None:
        clear_cut.observation_start_date = request.observation_start_date
        changed = True
    if request.observation_end_date is not None:
        clear_cut.observation_end_date = request.observation_end_date
        changed = True

    if request.boundary is not None:
        # Area (hectares, metric via geography) and centroid are derived from the
        # new perimeter by PostGIS, in the same statement.
        boundary = func.ST_Multi(
            func.ST_GeomFromText(shape(request.boundary.model_dump()).wkt, SRID)
        )
        db.execute(
            update(ClearCut)
            .where(ClearCut.id == clear_cut_id)
            .values(
                boundary=boundary,
                area_hectare=ST_Area(cast(boundary, Geography)) / 10000.0,
                location=ST_Centroid(boundary),
            )
        )
        changed = True

    if not changed:
        return get_clearcut_by_id(clear_cut_id, db)

    clear_cut.is_manually_edited = True
    clear_cut.manually_edited_at = datetime.now()
    clear_cut.manually_edited_by_id = connected_user.id
    # A fresh manual correction must re-lock the cut against the pipeline, even if
    # the override had been re-enabled for a previous run.
    clear_cut.allow_pipeline_override = False
    db.commit()

    # Recompute report totals, first/last cut date, average location and rules.
    sync_clear_cuts_reports(db)
    return get_clearcut_by_id(clear_cut_id, db)


def paginated_clear_cuts_query(
    db: Session, page: int = 0, size: int = 10
) -> RowReturningQuery[tuple[ClearCut, str, str]]:
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
    clear_cuts: Sequence[Row[tuple[ClearCut, str, str]]],
    clear_cuts_count: int,
    url: str,
    page: int,
    size: int,
) -> PaginationResponseSchema[ClearCutResponseSchema]:
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
