from pydantic import Field

from app.models import NATURA_2000, ClearCutEcologicalZoning, EcologicalZoning
from app.schemas.base import BaseSchema


class EcologicalZoningSchema(BaseSchema):
    type: str = Field(json_schema_extra={"example": NATURA_2000}, default=NATURA_2000)
    sub_type: str | None = Field(
        json_schema_extra={"example": "Protection des oiseaux"}, default=None
    )
    name: str = Field(
        json_schema_extra={
            "example": "Site à chauves-souris de La Guerche-sur-l'Aubois"
        }
    )
    code: str = Field(json_schema_extra={"example": "FR2402003"})


def ecological_zoning_to_ecological_zoning_schema(
    ecological_zoning: EcologicalZoning,
) -> EcologicalZoningSchema:
    return EcologicalZoningSchema(
        code=ecological_zoning.code,
        type=ecological_zoning.type,
        sub_type=ecological_zoning.sub_type,
        name=ecological_zoning.name,
    )


class ClearCutEcologicalZoningResponseSchema(EcologicalZoningSchema):
    id: str = Field(json_schema_extra={"example": "1"})
    area_hectare: float = Field(json_schema_extra={"example": 15})
    clear_cut_id: str = Field(json_schema_extra={"example": "1"})


def clear_cut_ecological_zoning_to_clear_cut_ecological_zoning_response_schema(
    ecological_zoning: ClearCutEcologicalZoning,
) -> ClearCutEcologicalZoningResponseSchema:
    return ClearCutEcologicalZoningResponseSchema(
        id=str(ecological_zoning.ecological_zoning_id),
        clear_cut_id=str(ecological_zoning.clear_cut_id),
        area_hectare=ecological_zoning.area_hectare,
        code=ecological_zoning.ecological_zoning.code,
        type=ecological_zoning.ecological_zoning.type,
        sub_type=ecological_zoning.ecological_zoning.sub_type,
        name=ecological_zoning.ecological_zoning.name,
    )


class EcologicalZoningResponseSchema(EcologicalZoningSchema):
    id: str


def ecological_zoning_to_ecological_zoning_response_schema(
    ecological_zoning: EcologicalZoning,
) -> EcologicalZoningResponseSchema:
    return EcologicalZoningResponseSchema(
        id=str(ecological_zoning.id),
        code=ecological_zoning.code,
        type=ecological_zoning.type,
        sub_type=ecological_zoning.sub_type,
        name=ecological_zoning.name,
    )
