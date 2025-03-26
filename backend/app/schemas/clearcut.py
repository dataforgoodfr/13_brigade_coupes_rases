from datetime import datetime
from logging import getLogger
from pydantic import (
    BaseModel,
    field_validator,
    Field,
    ConfigDict,
)

from shapely.geometry import Point, MultiPolygon
from typing import List, Optional, Tuple
from pydantic import BeforeValidator, field_validator
from typing import Annotated
from shapely import wkt


from app.schemas.shared import DepartmentBase, UserBase

logger = getLogger(__name__)


def validate_boundary(value: str) -> MultiPolygon:
    try:
        multi_polygon = wkt.loads(value)
        if not isinstance(multi_polygon, MultiPolygon):
            raise ValueError(
                "Invalid geometry format for boundary. Expected a MULTIPOLYGON WKT format."
            )
        return value
    except Exception as exception:
        print(exception)
        raise ValueError(
            "Invalid geometry format for boundary. Expected a MULTIPOLYGON WKT format."
        ) from exception


def validate_location(value: str) -> Point:
    try:
        point = wkt.loads(value)
        if not isinstance(point, Point):
            raise ValueError("Invalid point format for location. Expected a POINT WKT format.")
        return value
    except Exception as exception:
        print(exception)
        raise ValueError(
            "Invalid point format for location. Expected a POINT WKT format."
        ) from exception


BoundaryType = Annotated[
    str,
    BeforeValidator(validate_boundary),
]

LocationType = Annotated[
    str,
    BeforeValidator(validate_location),
]


class ClearCutCreate(BaseModel):
    slope_percentage: float
    cut_date: datetime
    location: LocationType
    boundary: BoundaryType
    department_code: str
    name_natura: str
    number_natura: str
    address: str


class ImportsClearCutResponse(BaseModel):
    id: int
    department_code: str
    slope_percentage: float
    cut_date: datetime
    created_at: datetime
    updated_at: datetime
    department_code: str
    location: str = Field(
        ...,
        json_schema_extra={"example": "POINT(2.380192, 48.878899)"},
    )
    boundary: str = Field(
        ...,
        json_schema_extra={
            "example": "MULTIPOLYGON((((2.381136, 48.881707), (2.381136, 48.881707)))"
        },
    )

    model_config = ConfigDict(from_attributes=True)


class ClearCutPatch(BaseModel):
    status: Optional[str] = None
    user_id: Optional[int] = None

    @field_validator("status")
    def validate_status(cls, value):
        if value not in ["pending", "validated"]:
            raise ValueError("Status must be one of: pending, validated")
        return value


class ClearCutResponse(BaseModel):
    id: int
    slope_percentage: float
    cut_date: datetime
    status: str
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    user: Optional[UserBase] = None
    department: Optional[DepartmentBase] = None
    location: Tuple[float, float] = Field(
        default_factory=Tuple[float, float],
        json_schema_extra={"example": "POINT(2.380192 48.878899)"},
    )
    boundary: List[Tuple[float, float]] = Field(
        default_factory=str,
        json_schema_extra={
            "example": "MULTIPOLYGON(((2.381136 48.881707, 2.379699 48.880338, 2.378497 48.878687, 2.378561 48.877615, 2.379162 48.876825, 2.381094 48.876175, 2.380879 48.877573, 2.382145 48.8788, 2.384012 48.879407, 2.383454 48.880127, 2.381694 48.880042, 2.381372 48.880973, 2.381136 48.881707)))"
        },
    )
    department_id: int

    model_config = ConfigDict(from_attributes=True)
