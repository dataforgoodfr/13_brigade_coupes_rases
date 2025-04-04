from datetime import date, datetime
from logging import getLogger
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import CLEARCUT_STATUSES, ClearCut, ClearCutReport
from app.schemas.ecological_zoning import (
    CreateEcologicalZoningSchema,
    EcologicalZoningSchema,
)


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

class ClearCutResponseSchema(ClearCutBaseSchema):
    id: str = Field(
        json_schema_extra={
            "example": "1",
        }
    )
    report_id: str = Field(
        json_schema_extra={
            "example": "1",
        }
    )   
    ecological_zonings_ids: list[str] = Field(
        json_schema_extra={
            "example": "[1,2,3]",
        }
    )
    created_at: datetime = Field(
        json_schema_extra={
            "example": "2023-01-01T00:00:00Z",
        }
    )
    updated_at: datetime = Field(
        json_schema_extra={
            "example": "2023-01-01T00:00:00Z",
        }
    )



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
        created_at=clear_cut.created_at,
        observation_start_date=clear_cut.observation_start_date,
        observation_end_date=clear_cut.observation_end_date,
        area_hectare=clear_cut.area_hectare,
        updated_at=clear_cut.updated_at,
    )
