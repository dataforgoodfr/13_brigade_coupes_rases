from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import Rules


class RuleBaseSchema(BaseModel):
    threshold: Optional[float] = Field(default=None, json_schema_extra={"example": "42"})
    ecological_zonings_ids: list[str] = Field(
        default=[], json_schema_extra={"example": ["1", "2", "3"]}
    )
    type: str = Field(json_schema_extra={"example": "slope"})

    model_config = ConfigDict(from_attributes=True)


class RuleResponseSchema(RuleBaseSchema):
    id: str = Field(json_schema_extra={"example": "1"})

    @field_validator("type")
    def validate_type(cls, value: str) -> str:
        if value is not None and value not in Rules.RULES:
            raise ValueError(f"Type must be one of : {', '.join(Rules.RULES)}")
        return value


def rule_to_rule_response(rule: Rules) -> RuleResponseSchema:
    return RuleResponseSchema(
        id=str(rule.id),
        ecological_zonings_ids=[
            str(ecological_zoning.id) for ecological_zoning in rule.ecological_zonings
        ],
        threshold=rule.threshold,
        type=rule.type,
    )
