from datetime import datetime
from logging import getLogger
from pydantic import BaseModel, field_validator, Field, ConfigDict
from shapely.geometry import Point, Polygon
from shapely.wkt import loads
from typing import Optional
import numpy as np

from app.schemas.shared import DepartmentBase, UserBase

logger = getLogger(__name__)

# Schema for creating a new ClearCut instance
class ClearCutCreate(BaseModel):
    slope_percentage: float
    cut_date: datetime
    location: str = Field(
        default_factory=str,
       json_schema_extra={"example": "POINT(48.8566 2.3522)"})
    boundary: str = Field(
        default_factory=str,
        json_schema_extra={"example":"POLYGON((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156))"})
    department_id: int

    @field_validator('location')
    def validate_location(cls, value: str) -> str:
        try:
            # Convert the WKT string into a geometric object
            point = loads(value)
            if not isinstance(point, Point):
                raise ValueError("Location must be a valid Point geometry")
        except Exception as e:
            raise ValueError("Invalid geometry format for location") from e
        return value
    
    @field_validator('boundary')
    def validate_boundary(cls, value: str) -> str:
        try:
            # Convert the WKT string into a geometric object
            polygon = loads(value)
            if not isinstance(polygon, Polygon):
                raise ValueError("Boundary must be a valid Polygon geometry")
            
            coordinates = np.array(polygon.exterior.coords)
            # TODO Improove code efficiency
            if np.isnan(coordinates).any():
                raise ValueError("NaN values detected in coordinates.")
            
        except Exception as e:
            raise ValueError("Invalid geometry format for boundary") from e
        return value


class ClearCutPatch(BaseModel):
    status: Optional[str] = None
    user_id: Optional[int] = None
    
    @field_validator('status')
    def validate_status(cls, value):
        if value not in ["pending", "validated"]:
            raise ValueError("Status must be one of: pending, validated")
        return value


class ClearCutResponse(ClearCutCreate):
    id: int
    status: str
    user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    user: Optional[UserBase] = None
    department: Optional[DepartmentBase] = None

    model_config = ConfigDict(from_attributes = True)
