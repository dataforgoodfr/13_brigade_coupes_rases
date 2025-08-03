from logging import getLogger

from pydantic import ConfigDict

from app.schemas.base import BaseSchema
from app.schemas.ecological_zoning import EcologicalZoningSchema
from app.schemas.rule import RuleResponseSchemaWithoutIdSchema

logger = getLogger(__name__)


class ReferentialDepartmentSchema(BaseSchema):
    code: str
    name: str
    


class ReferentialResponseSchema(BaseSchema):
    departments: dict[str, ReferentialDepartmentSchema]
    ecological_zonings: dict[str, EcologicalZoningSchema]
    rules: dict[str, RuleResponseSchemaWithoutIdSchema]

    
