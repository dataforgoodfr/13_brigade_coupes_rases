from typing import List, Tuple
from pydantic import BaseModel, Field


class ClearcutBase(BaseModel):
    name: str
    description: str | None = None
    geoCoordinates: List[Tuple[float, float]] = Field(
        default_factory=list,
        example=
            [(1.0, 2.0), (3.0, 4.0), (5.0, 6.0)]
    )
    cutYear: int


class ClearcutCreate(ClearcutBase):
    pass


class ClearcutResponse(ClearcutBase):
    id: int

    class Config:
        orm_mode = True
