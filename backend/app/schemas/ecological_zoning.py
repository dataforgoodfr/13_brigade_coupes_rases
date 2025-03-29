from typing import Optional
from pydantic import BaseModel, Field

from app.models import NATURA_2000


class EcologicalZoningSchema(BaseModel):
    type: str = Field(json_schema_extra={"example": NATURA_2000}, default=NATURA_2000)
    sub_type: Optional[str] = Field(
        json_schema_extra={"example": "Protection des oiseaux"}, default=None
    )
    name: str = Field(
        json_schema_extra={"example": "Site à chauves-souris de La Guerche-sur-l'Aubois"}
    )
    code: str = Field(json_schema_extra={"example": "FR2402003"})
