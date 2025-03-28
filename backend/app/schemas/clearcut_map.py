from logging import getLogger
from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, Field, ConfigDict

from app.models import ClearCut
from app.schemas.city import CityPreview, city_to_preview
from app.schemas.clearcut import ClearCutBase
from app.schemas.tag import TAGS


logger = getLogger(__name__)


class ClearCutPreview(ClearCutBase):
    id: str = (Field(json_schema_extra={"example": "1"}),)
    location: Point
    boundary: MultiPolygon
    tags: list[str] = (
        Field(
            json_schema_extra={"example": "[1,2,3]"},
        ),
    )
    status: str = Field(
        json_schema_extra={"example": "validated"},
    )
    city: CityPreview
    model_config = ConfigDict(from_attributes=True)


def clearcut_to_preview(clearcut: ClearCut) -> ClearCutPreview:
    return ClearCutPreview(
        id=str(clearcut.id),
        boundary=MultiPolygon.model_validate_json(clearcut.boundary),
        location=Point.model_validate_json(clearcut.location),
        tags=[tag for tag in TAGS],
        status=clearcut.status,
        slope_percentage=clearcut.slope_percentage,
        city=city_to_preview(clearcut.city),
        cut_date=clearcut.cut_date.date(),
    )


class ClearCutMapResponse(BaseModel):
    points: list[Point]
    previews: list[ClearCutPreview]

    model_config = ConfigDict(from_attributes=True)
