from datetime import datetime
from logging import getLogger
from pydantic import BaseModel, field_validator, Field, ConfigDict
from shapely.geometry import Point, MultiPolygon
from typing import List, Optional, Tuple
from pydantic import BeforeValidator
from typing import Annotated

from app.schemas.shared import DepartmentBase, UserBase

logger = getLogger(__name__)


def validate_boundary(value: List[List[List[Tuple[float, float]]]]):
    try:
        MultiPolygon(value)
        return value
    except Exception as exception:
        print(exception)
        raise ValueError("Invalid geometry format for boundary") from exception


def validate_location(value: Tuple[float, float]):
    try:
        Point(value)
        return value
    except Exception as exception:
        print(exception)
        raise ValueError("Invalid point format for location") from exception


MultiPolygonType = Annotated[
    List[List[List[Tuple[float, float]]]], BeforeValidator(validate_boundary)
]

LocationType = Annotated[Tuple[float, float], BeforeValidator(validate_location)]


class ClearCutCreate(BaseModel):
    slope_percentage: float
    cut_date: datetime
    location: LocationType
    boundary: MultiPolygonType
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
    location: Tuple[float, float] = Field(
        ...,
        json_schema_extra={"example": "[2.380192, 48.878899]"},
    )
    boundary: List[List[List[Tuple[float, float]]]] = Field(
        ...,
        json_schema_extra={"example": "[[[[2.381136, 48.881707], [2.381136, 48.881707]]]]"},
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
        json_schema_extra={"example": "[2.380192, 48.878899]"},
    )
    boundary: List[Tuple[float, float]] = Field(
        default_factory=str,
        json_schema_extra={
            "example": "[[2.381136, 48.881707], [2.379699, 48.880338], [2.378497, 48.878687], [2.378561, 48.877615], [2.379162, 48.876825], [2.381094, 48.876175], [2.380879, 48.877573], [2.382145, 48.8788], [2.384012, 48.879407], [2.383454, 48.880127], [2.381694, 48.880042], [2.381372, 48.880973], [2.381136, 48.881707]]"
        },
    )
    department_id: int

    model_config = ConfigDict(from_attributes=True)
