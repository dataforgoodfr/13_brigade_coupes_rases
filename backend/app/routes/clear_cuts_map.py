from logging import getLogger

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.deps import db_session
from app.models import CLEARCUT_STATUSES
from app.schemas.clear_cut_map import (
    ClearCutMapResponseSchema,
    ClearCutReportPreviewSchema,
)
from app.services.clear_cut_map import (
    Filters,
    GeoBounds,
    build_clearcuts_map,
    get_report_preview_by_id,
)
from app.services.user_auth import get_optional_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-map", tags=["Clearcut map"])


@router.get(
    "/{report_id}",
    response_model=ClearCutReportPreviewSchema,
    response_model_exclude_none=True,
)
def get_clearcuts_report_by_id(
    report_id: int, db: Session = db_session
) -> ClearCutReportPreviewSchema:
    try:
        return get_report_preview_by_id(db, report_id=report_id)
    except Exception as e:
        raise AppHTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/",
    response_model=ClearCutMapResponseSchema,
    response_model_exclude_none=True,
)
def get_clearcuts_map(
    sw_lat: float | None = Query(
        None,
        alias="swLat",
        description="Sout west latitude",
        openapi_examples={"default": {"value": 47.49308072945064}},
    ),
    sw_lng: float | None = Query(
        None,
        alias="swLng",
        description="Sout west longitude",
        openapi_examples={"default": {"value": -1.0766601562500002}},
    ),
    ne_lat: float | None = Query(
        None,
        alias="neLat",
        description="North east latitude",
        openapi_examples={"default": {"value": 49.79899569636492}},
    ),
    ne_lng: float | None = Query(
        None,
        alias="neLng",
        description="North east longitude",
        openapi_examples={"default": {"value": 4.051208496093751}},
    ),
    min_area_hectare: float | None = Query(
        None,
        alias="minAreaHectare",
        description="Minimum area in hectare",
        openapi_examples={"default": {"value": 1.0}},
    ),
    max_area_hectare: float | None = Query(
        None,
        alias="maxAreaHectare",
        description="Maximum area in hectare",
        openapi_examples={"default": {"value": 100.0}},
    ),
    cut_years: list[int] = Query(
        [],
        alias="cutYears",
        description="List of cut years",
        openapi_examples={"default": {"value": [2024, 2025, 2026]}},
    ),
    statuses: list[str] = Query(
        [],
        description="List of statuses",
        openapi_examples={"default": {"value": CLEARCUT_STATUSES}},
    ),
    departments_ids: list[str] = Query(
        [],
        alias="departmentsIds",
        description="List of department ids",
        openapi_examples={"default": {"value": ["1"]}},
    ),
    has_ecological_zonings: bool | None = Query(
        None,
        alias="hasEcologicalZonings",
        description="Has ecological zonings",
        openapi_examples={"default": {"value": False}},
    ),
    excessive_slope: bool | None = Query(
        None,
        alias="excessiveSlope",
        description="Excessive slope",
        openapi_examples={"default": {"value": False}},
    ),
    with_points: bool | None = Query(
        None,
        alias="withPoints",
        description="Excessive slope",
        openapi_examples={"default": {"value": False}},
    ),
    favorite: bool | None = Query(
        None,
        alias="favorite",
        description="Is favorite",
        openapi_examples={"default": {"value": None}},
    ),
    db: Session = db_session,
    user=Depends(get_optional_current_user),
) -> ClearCutMapResponseSchema:
    try:
        bounds = None
        if (
            sw_lat is not None
            and sw_lng is not None
            and ne_lat is not None
            and ne_lng is not None
        ):
            bounds = GeoBounds(
                north_east_latitude=ne_lat,
                north_east_longitude=ne_lng,
                south_west_latitude=sw_lat,
                south_west_longitude=sw_lng,
            )
        clearcuts = build_clearcuts_map(
            db,
            with_points if with_points is not None else False,
            Filters(
                bounds=bounds,
                min_area_hectare=min_area_hectare,
                max_area_hectare=max_area_hectare,
                cut_years=cut_years,
                statuses=statuses,
                departments_ids=departments_ids,
                has_ecological_zonings=has_ecological_zonings,
                excessive_slope=excessive_slope,
                is_favorite=favorite,
                current_user_id=user.id,
            ),
        )

    except Exception as e:
        raise AppHTTPException(status_code=500, detail=str(e)) from e

    return clearcuts
