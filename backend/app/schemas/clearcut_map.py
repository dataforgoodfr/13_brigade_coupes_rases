from logging import getLogger
from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, Field, ConfigDict

from app.models import ClearCut
from app.schemas.city import (
    CityPreviewSchema,
    cities_to_preview_schemas,
)
from app.schemas.clearcut import ClearCutBaseSchema
from app.schemas.tag import TAGS


logger = getLogger(__name__)


class ClearCutPreviewSchema(ClearCutBaseSchema):
    id: str = Field(json_schema_extra={"example": "1"})
    location: Point
    boundary: MultiPolygon
    tags: list[str] = Field(
        json_schema_extra={"example": "[1,2,3]"},
    )
    status: str = Field(
        json_schema_extra={"example": "validated"},
    )
    ecological_zoning_ids: list[str]
    cities: dict[str, CityPreviewSchema]
    model_config = ConfigDict(from_attributes=True)


def clearcut_to_preview_schema(clearcut: ClearCut) -> ClearCutPreviewSchema:
    return ClearCutPreviewSchema(
        id=str(clearcut.id),
        boundary=MultiPolygon.model_validate_json(clearcut.boundary),
        location=Point.model_validate_json(clearcut.location),
        tags=[tag for tag in TAGS],
        status=clearcut.status,
        slope_percentage=clearcut.slope_percentage,
        area_hectare=clearcut.area_hectare,
        cities=cities_to_preview_schemas([registry.city for registry in clearcut.registries]),
        cut_date=clearcut.cut_date.date(),
        ecological_zoning_ids=[
            str(ecological_zoning.id) for ecological_zoning in clearcut.ecological_zonings
        ],
    )


class ClearCutMapResponseSchema(BaseModel):
    points: list[Point]
    previews: list[ClearCutPreviewSchema]

    model_config = ConfigDict(from_attributes=True)
