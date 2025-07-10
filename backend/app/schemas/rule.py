from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import Rules


class RuleBaseSchema(BaseModel):
    threshold: float | None = Field(default=None, json_schema_extra={"example": "42"})
    ecological_zonings_ids: list[str] = Field(
        default=[], json_schema_extra={"example": ["1", "2", "3"]}
    )

    model_config = ConfigDict(from_attributes=True)


class RuleUpdateSchema(RuleBaseSchema):
    id: int = Field(json_schema_extra={"example": 1})


class RulesUpdateSchema(BaseModel):
    rules: list[RuleUpdateSchema]


class RuleResponseSchemaWithoutIdSchema(RuleBaseSchema):
    type: str = Field(json_schema_extra={"example": "slope"})

    @field_validator("type")
    def validate_type(cls, value: str) -> str:
        if value is not None and value not in Rules.RULES:
            raise ValueError(f"Type must be one of : {', '.join(Rules.RULES)}")
        return value


class RuleResponseSchema(RuleBaseSchema):
    id: str = Field(json_schema_extra={"example": "1"})
    type: str = Field(json_schema_extra={"example": "slope"})

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


class RuleSchema(BaseModel):
    id: int
    threshold: float | None
    ecological_zonings_ids: list[int]


def rule_to_rule(rule: Rules) -> RuleSchema:
    return RuleSchema(
        id=rule.id,
        ecological_zonings_ids=[
            ecological_zoning.id for ecological_zoning in rule.ecological_zonings
        ],
        threshold=rule.threshold,
    )


class RulesSchema(BaseModel):
    slope: RuleSchema
    area: RuleSchema
    ecological_zoning: RuleSchema


class AllRules:
    def __init__(self, area: Rules, slope: Rules, ecological_zoning: Rules):
        self.area = area
        self.slope = slope
        self.ecological_zoning = ecological_zoning
