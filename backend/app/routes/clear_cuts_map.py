from logging import getLogger
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import db_session
from app.models import CLEARCUT_STATUSES
from app.schemas.clear_cut_map import (
    ClearCutMapResponseSchema,
    ClearCutReportPreviewSchema,
)
from app.services.clear_cut_map import (
    Filters,
    build_clearcuts_map,
    get_report_preview_by_id,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clear-cuts-map", tags=["Clearcut map"])


@router.get("/{report_id}", response_model=ClearCutReportPreviewSchema)
def get_clearcuts_report_by_id(
    report_id: int, db: Session = db_session
) -> ClearCutReportPreviewSchema:
    try:
        return get_report_preview_by_id(db, report_id=report_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/", response_model=ClearCutMapResponseSchema)
def get_clearcuts_map(
    sw_lat: float = Query(
        ...,
        description="Sout west latitude",
        openapi_examples={"default": {"value": 47.49308072945064}},
    ),
    sw_lng: float = Query(
        ...,
        description="Sout west longitude",
        openapi_examples={"default": {"value": -1.0766601562500002}},
    ),
    ne_lat: float = Query(
        ...,
        description="North east latitude",
        openapi_examples={"default": {"value": 49.79899569636492}},
    ),
    ne_lng: float = Query(
        ...,
        description="North east longitude",
        openapi_examples={"default": {"value": 4.051208496093751}},
    ),
    min_area_hectare: Optional[float] = Query(
        None,
        description="Minimum area in hectare",
        openapi_examples={"default": {"value": 1.0}},
    ),
    max_area_hectare: Optional[float] = Query(
        None,
        description="Maximum area in hectare",
        openapi_examples={"default": {"value": 100.0}},
    ),
    cut_years: list[int] = Query(
        [],
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
        description="List of department ids",
        openapi_examples={"default": {"value": ["1"]}},
    ),
    has_ecological_zonings: Optional[bool] = Query(
        None,
        description="Has ecological zonings",
        openapi_examples={"default": {"value": False}},
    ),
    db: Session = db_session,
) -> ClearCutMapResponseSchema:
    try:
        clearcuts = build_clearcuts_map(
            db,
            Filters(
                south_west_latitude=sw_lat,
                south_west_longitude=sw_lng,
                north_east_latitude=ne_lat,
                north_east_longitude=ne_lng,
                min_area_hectare=min_area_hectare,
                max_area_hectare=max_area_hectare,
                cut_years=cut_years,
                statuses=statuses,
                departments_ids=departments_ids,
                has_ecological_zonings=has_ecological_zonings,
            ),
        )
        print(f"CLEARCUTS : {clearcuts}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    return clearcuts
