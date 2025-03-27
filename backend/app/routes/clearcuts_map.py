from logging import getLogger

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import db_session
from app.schemas.clearcut_map import ClearCutMapResponse
from app.services.clearcut import (
    GeoBounds,
    get_clearcuts_map,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clearcuts-map", tags=["Clearcut map"])


@router.get("/", response_model=ClearCutMapResponse)
def list_clearcut_preview(
    swLat: float = Query(
        ...,
        description="Sout west latitude",
        openapi_examples={"paris": {"value": 47.49308072945064}},
    ),
    swLng: float = Query(
        ...,
        description="Sout west longitude",
        openapi_examples={"paris": {"value": -1.0766601562500002}},
    ),
    neLat: float = Query(
        ...,
        description="North east latitude",
        openapi_examples={"paris": {"value": 49.79899569636492}},
    ),
    neLng: float = Query(
        ...,
        description="North east longitude",
        openapi_examples={"paris": {"value": 4.051208496093751}},
    ),
    cutYears: list[int] = Query(
        ..., description="Cut years", openapi_examples={"2025": {"value": 2025}}
    ),
    db: Session = db_session,
) -> ClearCutMapResponse:
    try:
        clearcuts = get_clearcuts_map(
            db,
            GeoBounds(
                south_west_latitude=swLat,
                south_west_longitude=swLng,
                north_east_latitude=neLat,
                north_east_longitude=neLng,
            ),
        )

    except ValueError as err:
        raise HTTPException(
            status_code=400, detail="Invalid input format for geobounds"
        ) from err
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return clearcuts
