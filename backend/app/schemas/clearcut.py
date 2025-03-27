from datetime import datetime
from logging import getLogger
from typing import Annotated, List, Optional, Tuple

from geojson_pydantic import Feature, MultiPolygon, Point
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator
from shapely import wkt

from app.schemas.shared import DepartmentBase, UserBase

logger = getLogger(__name__)


class City(BaseModel):
    department_id: str
    name: str
    zip_code: str


class ClearCutCreate(BaseModel):
    slope_percentage: float
    cut_date: datetime
    location: Point
    boundary: MultiPolygon
    department_code: str
    name_natura: str
    number_natura: str
    address: str


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
    location: Point
    boundary: MultiPolygon
    department_id: int

    model_config = ConfigDict(from_attributes=True)
