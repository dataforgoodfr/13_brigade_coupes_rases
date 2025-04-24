from datetime import datetime
from typing import Optional

from geojson_pydantic import MultiPolygon, Point
from pydantic import BaseModel, Field

from app.models import ClearCut
from app.schemas.ecological_zoning import EcologicalZoningSchema


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
    bdf_resinous_area_hectare: Optional[float] = Field(
        None,
        json_schema_extra={
            "example": 15,
        },
    )
    bdf_deciduous_area_hectare: Optional[float] = Field(
        None,
        json_schema_extra={
            "example": 15,
        },
    )
    bdf_mixed_area_hectare: Optional[float] = Field(
        None,
        json_schema_extra={
            "example": 15,
        },
    )
    bdf_poplar_area_hectare: Optional[float] = Field(
        None,
        json_schema_extra={
            "example": 15,
        },
    )
    ecological_zoning_area_hectare: Optional[float] = Field(
        None,
        json_schema_extra={
            "example": 15,
        },
    )


class ClearCutCreateSchema(ClearCutBaseSchema):
    ecological_zonings: list[EcologicalZoningSchema] = Field(default=[])


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
            str(ecological_zoning.ecological_zoning_id)
            for ecological_zoning in clear_cut.ecological_zonings
        ],
        created_at=clear_cut.created_at,
        observation_start_date=clear_cut.observation_start_date,
        observation_end_date=clear_cut.observation_end_date,
        area_hectare=clear_cut.area_hectare,
        updated_at=clear_cut.updated_at,
        bdf_deciduous_area_hectare=clear_cut.bdf_deciduous_area_hectare,
        bdf_resinous_area_hectare=clear_cut.bdf_resinous_area_hectare,
        bdf_mixed_area_hectare=clear_cut.bdf_mixed_area_hectare,
        bdf_poplar_area_hectare=clear_cut.bdf_poplar_area_hectare,
        ecological_zoning_area_hectare=clear_cut.ecological_zoning_area_hectare,
    )
