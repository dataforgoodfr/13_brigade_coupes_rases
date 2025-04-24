from logging import getLogger
from typing import Dict

from pydantic import BaseModel, ConfigDict

from app.schemas.ecological_zoning import EcologicalZoningSchema
from app.schemas.rule import RuleResponseSchemaWithoutIdSchema

logger = getLogger(__name__)


class ReferentialDepartmentSchema(BaseModel):
    code: str
    name: str
    model_config = ConfigDict(from_attributes=True)


class ReferentialResponseSchema(BaseModel):
    departments: Dict[str, ReferentialDepartmentSchema]
    ecological_zonings: Dict[str, EcologicalZoningSchema]
    rules: Dict[str, RuleResponseSchemaWithoutIdSchema]

    model_config = ConfigDict(from_attributes=True)
