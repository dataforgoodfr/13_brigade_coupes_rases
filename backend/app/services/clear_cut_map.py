from fastapi import HTTPException
from geojson_pydantic import Point
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import SRID, ClearCut, ClearCutReport
from app.schemas.clear_cut import ClearCutResponseSchema
from app.schemas.clear_cut_report import (
    CreateClearCutsReportCreateSchema,
    ClearCutReportPatchSchema,
    ClearCutReportResponseSchema,
    report_to_response_schema,
)
from logging import getLogger
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from geoalchemy2.functions import (
    ST_Contains,
    ST_MakeEnvelope,
    ST_SetSRID,
    ST_AsGeoJSON,
    ST_Union,
    ST_Centroid,
    ST_Multi,
)

from app.schemas.clear_cut_map import (
    ClearCutMapResponseSchema,
    clearcut_to_preview_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.services.ecological_zoning import find_or_add_ecological_zonings
from app.services.registries import find_or_add_registries
from fastapi import status

logger = getLogger(__name__)


class GeoBounds(BaseModel):
    south_west_latitude: float
    south_west_longitude: float
    north_east_latitude: float
    north_east_longitude: float


def build_clearcuts_map(
    db: Session, geo_bounds: GeoBounds
) -> ClearCutMapResponseSchema:
    envelope = ST_MakeEnvelope(
        geo_bounds.south_west_longitude,
        geo_bounds.south_west_latitude,
        geo_bounds.north_east_longitude,
        geo_bounds.north_east_latitude,
        SRID,
    )
    square = ST_SetSRID(envelope, SRID)
    average_locations = (
        db.query(
            ClearCut.report_id,
            ST_Centroid(ST_Multi(ST_Union(ClearCut.location))).label(
                "average_location"
            ),
        )
        .group_by(ClearCut.report_id)
        .subquery()
    )
    points = (
        db.query(ST_AsGeoJSON(average_locations.c.average_location))
        .filter(ST_Contains(square, average_locations.c.average_location))
        .all()
    )

    # clearcuts = (
    #     db.query(
    #         ClearCutReport,
    #         ST_AsGeoJSON(ClearCutReport.clear_cuts.location),
    #         ST_AsGeoJSON(ClearCutReport.clear_cuts.boundary),
    #     )
    #     .filter(ST_Contains(square, ClearCutReport.clear_cuts.location))
    #     .order_by(ClearCutReport.clear_cuts.created_at)
    #     .all()
    # )
    # for [clearcut, location, boundary] in clearcuts:
    #     clearcut.location = location
    #     clearcut.boundary = boundary

    # previews = [clearcut_to_preview_schema(row[0]) for row in clearcuts]

    map_response = ClearCutMapResponseSchema(
        points=[Point.model_validate_json(point[0]) for point in points],
        previews=[],
    )
    return map_response
