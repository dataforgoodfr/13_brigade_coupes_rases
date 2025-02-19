from typing import List, Tuple
from pydantic import BaseModel, Field

from app.schemas.shared import Point

class SlopeBase(BaseModel):
    name: str
    description: str | None = None
    geoCoordinates: List[Tuple[float, float]] = Field(
        default_factory=list,
        example=
            [(1.0, 2.0), (3.0, 4.0), (5.0, 6.0)]
    )


class SlopeCreate(SlopeBase):
    pass


class SlopeResponse(SlopeBase):
    id: int

    class Config:
        orm_mode = True
