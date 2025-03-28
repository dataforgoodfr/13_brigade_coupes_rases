from logging import getLogger
from typing import Dict

from pydantic import BaseModel, ConfigDict

from app.schemas.tag import Tag


logger = getLogger(__name__)


class ReferentialDepartment(BaseModel):
    code: str
    name: str
    model_config = ConfigDict(from_attributes=True)


class ReferentialResponse(BaseModel):
    departments: Dict[str, ReferentialDepartment]
    ecological_zonings: Dict[str, str]
    tags: Dict[str, Tag]

    model_config = ConfigDict(from_attributes=True)
