from typing import Optional
from pydantic import BaseModel, Field

from app.models import NATURA_2000, EcologicalZoning


class EcologicalZoningSchema(BaseModel):
    type: str = Field(json_schema_extra={"example": NATURA_2000}, default=NATURA_2000)
    sub_type: Optional[str] = Field(
        json_schema_extra={"example": "Protection des oiseaux"}, default=None
    )
    name: str = Field(
        json_schema_extra={"example": "Site à chauves-souris de La Guerche-sur-l'Aubois"}
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


class IdentifiedEcologicalZoningSchema(EcologicalZoningSchema):
    id: str


def ecological_zoning_to_identified_ecological_zoning_schema(
    ecological_zoning: EcologicalZoning,
) -> IdentifiedEcologicalZoningSchema:
    return IdentifiedEcologicalZoningSchema(
        id=str(ecological_zoning.id),
        code=ecological_zoning.code,
        type=ecological_zoning.type,
        sub_type=ecological_zoning.sub_type,
        name=ecological_zoning.name,
    )
