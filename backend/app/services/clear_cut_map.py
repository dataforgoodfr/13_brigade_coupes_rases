from typing import Optional
from fastapi import HTTPException
from geojson_pydantic import Point
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, case, and_, between
from app.models import (
    SRID,
    City,
    ClearCut,
    ClearCutEcologicalZoning,
    ClearCutReport,
    Department,
)
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
    row_to_report_preview_schema,
)
from app.schemas.hateoas import PaginationMetadataSchema, PaginationResponseSchema
from app.services.ecological_zoning import find_or_add_ecological_zonings
from fastapi import status

logger = getLogger(__name__)


class Filters(BaseModel):
    south_west_latitude: float
    south_west_longitude: float
    north_east_latitude: float
    north_east_longitude: float
    min_area_hectare: Optional[float] = None
    max_area_hectare: Optional[float] = None
    cut_years: list[int] = None
    departments_ids: list[int]
    statuses: list[str]
    has_ecological_zonings: bool


def build_clearcuts_map(db: Session, filters: Filters) -> ClearCutMapResponseSchema:
    envelope = ST_MakeEnvelope(
        filters.south_west_longitude,
        filters.south_west_latitude,
        filters.north_east_longitude,
        filters.north_east_latitude,
        SRID,
    )
    square = ST_SetSRID(envelope, SRID)
    aggregated_cuts_in_boundary = (
        db.query(
            ClearCut.report_id,
            func.sum(ClearCut.area_hectare).label("total_area_hectare"),
            func.min(ClearCut.observation_start_date).label("cut_start"),
            func.max(ClearCut.observation_end_date).label("cut_end"),
            func.max(ClearCut.updated_at).label("last_update"),
            func.sum(
                case((ClearCutEcologicalZoning.clear_cut_id == None, 0), else_=1)
            ).label("ecological_zonings_count"),
            func.count(ClearCutEcologicalZoning.clear_cut_id).label(
                "clear_cuts_ecological_zonings_count"
            ),
            ST_Centroid(ST_Multi(ST_Union(ClearCut.location))).label(
                "average_location"
            ),
        )
        .join(
            ClearCutEcologicalZoning,
            ClearCutEcologicalZoning.clear_cut_id == ClearCut.id,
            isouter=True,
        )
        .filter(ST_Contains(square, ClearCut.location))
        .group_by(ClearCut.report_id)
        .subquery()
    )

    reports = (
        db.query(
            ST_AsGeoJSON(aggregated_cuts_in_boundary.c.average_location),
            ClearCutReport,
            aggregated_cuts_in_boundary,
        )
        .join(
            aggregated_cuts_in_boundary,
            aggregated_cuts_in_boundary.c.report_id == ClearCutReport.id,
        )
        .join(City, ClearCutReport.city)
        .join(Department, City.department)
    )
    if filters.has_ecological_zonings:
        reports = reports.filter(
            aggregated_cuts_in_boundary.c.ecological_zonings_count
            == aggregated_cuts_in_boundary.c.clear_cuts_ecological_zonings_count
        )
    else:
        reports = reports.filter(
            aggregated_cuts_in_boundary.c.ecological_zonings_count == 0
        )
    if len(filters.cut_years) > 0:
        cut_years_intervals = [
            and_(
                func.extract("year", aggregated_cuts_in_boundary.c.cut_start) <= year,
                func.extract("year", aggregated_cuts_in_boundary.c.cut_end) >= year,
            )
            for year in filters.cut_years
        ]
        reports = reports.filter(or_(*cut_years_intervals))

    if filters.departments_ids and len(filters.departments_ids) > 0:
        reports = reports.filter(Department.id.in_(map(int, filters.departments_ids)))

    if len(filters.statuses) > 0:
        reports = reports.filter(ClearCutReport.status.in_(filters.statuses))

    if filters.min_area_hectare is not None:
        reports = reports.filter(
            aggregated_cuts_in_boundary.c.total_area_hectare >= filters.min_area_hectare
        )

    if filters.max_area_hectare is not None:
        reports = reports.filter(
            aggregated_cuts_in_boundary.c.total_area_hectare <= filters.max_area_hectare
        )
    points = reports.all()
    reports = reports.order_by(ClearCutReport.updated_at.desc()).limit(30).all()

    map_response = ClearCutMapResponseSchema(
        points=[Point.model_validate_json(point[0]) for point in points],
        previews=list(map(row_to_report_preview_schema, reports)),
    )
    return map_response
