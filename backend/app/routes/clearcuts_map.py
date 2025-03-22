from logging import getLogger

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.deps import get_db_session
from app.schemas.clearcut_map import ClearCutMapResponse
from app.services.clearcut import (
    GeoBounds,
    get_clearcuts_map,
)

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/clearcuts-map", tags=["Clearcut map"])
db_dependency = get_db_session()


@router.get("/", response_model=ClearCutMapResponse)
def list_clearcut_preview(
    swLat: float = Query(
        ...,
        description="Sout west latitude",
        examples=5.507318,
    ),
    swLng: float = Query(..., description="Sout west longitude", examples=[43.352167]),
    neLat: float = Query(..., description="North east latitude", examples=[5.283674]),
    neLng: float = Query(..., description="North east longitude", examples=[43.192417]),
    cutYears: list[int] = Query(..., description="Cut years", examples=[2021, 2022]),
    db: Session = db_dependency,
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
