from logging import getLogger

from pydantic import BaseModel, ConfigDict

from app.schemas.ecological_zoning import EcologicalZoningSchema
from app.schemas.rule import RuleResponseSchemaWithoutIdSchema

logger = getLogger(__name__)


class ReferentialDepartmentSchema(BaseModel):
    code: str
    name: str
    model_config = ConfigDict(from_attributes=True)


class ReferentialResponseSchema(BaseModel):
    departments: dict[str, ReferentialDepartmentSchema]
    ecological_zonings: dict[str, EcologicalZoningSchema]
    rules: dict[str, RuleResponseSchemaWithoutIdSchema]

    model_config = ConfigDict(from_attributes=True)
