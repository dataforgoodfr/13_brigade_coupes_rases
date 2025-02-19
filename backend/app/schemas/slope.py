from pydantic import BaseModel, Field

from app.schemas.shared import Point

class SlopeBase(BaseModel):
    name: str
    description: str | None = None
    geoCoordinates: list[Point] = Field(
        default_factory=tuple,
        example=[
            (48.8566, 2.3522),
            (34.0522,-118.2437),
            (36.0522,-119.5696),
        ]
    )


class SlopeCreate(SlopeBase):
    pass


class SlopeResponse(SlopeBase):
    id: int

    class Config:
        orm_mode = True
