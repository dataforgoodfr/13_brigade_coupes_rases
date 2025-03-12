from logging import getLogger
from typing import Dict

from pydantic import BaseModel, ConfigDict


logger = getLogger(__name__)

class ReferentialTag(BaseModel):
    type: str
    value: float
    model_config = ConfigDict(from_attributes = True)

class ReferentialDepartment(BaseModel):
    code: str
    name: str
    model_config = ConfigDict(from_attributes = True)

class ReferentialResponse(BaseModel):
    departments: Dict[str, ReferentialDepartment]
    ecological_zonings: Dict[str, str]
    tags: Dict[str, ReferentialTag]

    model_config = ConfigDict(from_attributes = True)
