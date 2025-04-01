from datetime import date, datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import CLEARCUT_STATUSES, ClearCut, ClearCutReport
from app.schemas.ecological_zoning import CreateEcologicalZoningSchema, EcologicalZoningSchema
from app.schemas.registry import CreateRegistrySchema


class ClearCutBaseSchema(BaseModel):
    location: Point = Field(
        json_schema_extra={
            "example": {"type": "Point", "coordinates": [2.3522, 48.8566]},
        }
    )
    boundary: MultiPolygon = Field(
        json_schema_extra={
            "example": {
                "type": "MultiPolygon",
                "coordinates": [
                    [
                        [
                            [2.3522, 48.8566],
                            [2.3622, 48.8566],
                            [2.3622, 48.8666],
                            [2.3522, 48.8566],
                        ]
                    ]
                ],
            }
        }
    )
    area_hectare: float = Field(
        json_schema_extra={
            "example": 15,
        }
    )
    observation_start_date: datetime = Field(
        json_schema_extra={
            "example": "2023-01-01T00:00:00Z",
        }
    )
    observation_end_date: datetime = Field(
        json_schema_extra={
            "example": "2023-01-01T00:00:00Z",
        }
    )


class ClearCutCreateSchema(ClearCutBaseSchema):
    ecological_zonings: list[CreateEcologicalZoningSchema] = Field(default=[])
    registries: list[CreateRegistrySchema]


class ClearCutResponseSchema(ClearCutBaseSchema):
    id: str
    report_id: str
    ecological_zonings_ids: list[str]
    created_at: datetime
    updated_at: datetime
    registries_ids: list[str]



def clear_cut_to_clear_cut_response_schema(
    clear_cut: ClearCut,
) -> ClearCutResponseSchema:
    return ClearCutResponseSchema(
        id=str(clear_cut.id),
        report_id=str(clear_cut.report_id),
        boundary=MultiPolygon.model_validate_json(clear_cut.boundary),
        location=Point.model_validate_json(clear_cut.location),
        ecological_zonings_ids=[
            str(ecological_zoning.id)
            for ecological_zoning in clear_cut.ecological_zonings
        ],
        registries_ids=[str(registry.id) for registry in clear_cut.registries],
        created_at=clear_cut.created_at,
        observation_start_date=clear_cut.observation_start_date,
        observation_end_date=clear_cut.observation_end_date,
        area_hectare=clear_cut.area_hectare,
        updated_at=clear_cut.updated_at,
    )
