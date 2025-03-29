from logging import getLogger
from typing import Dict

from pydantic import BaseModel, ConfigDict

from app.schemas.tag import TagSchema


logger = getLogger(__name__)


class ReferentialDepartmentSchema(BaseModel):
    code: str
    name: str
    model_config = ConfigDict(from_attributes=True)


class ReferentialResponseSchema(BaseModel):
    departments: Dict[str, ReferentialDepartmentSchema]
    ecological_zonings: Dict[str, str]
    tags: Dict[str, TagSchema]

    model_config = ConfigDict(from_attributes=True)
