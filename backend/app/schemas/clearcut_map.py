from datetime import datetime
from logging import getLogger
from pydantic import BaseModel, field_validator, Field, ConfigDict
from shapely.geometry import Point, Polygon
from shapely.wkt import loads
from typing import List, Optional, Tuple
import numpy as np

from app.schemas.clearcut import ClearCutBase
from app.schemas.shared import DepartmentBase, UserBase

logger = getLogger(__name__)


class ClearCutPreview(ClearCutBase):
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

    model_config = ConfigDict(from_attributes=True)



class ClearCutMapResponse(BaseModel):
    points: list[tuple[float, float]]
    previews: list[ClearCutPreview]

    model_config = ConfigDict(from_attributes=True)
