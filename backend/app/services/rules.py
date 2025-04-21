from fastapi import HTTPException
from sqlalchemy.orm import Query, Session

from app.models import Rules
from app.schemas.rule import (
    RuleBaseSchema,
    RuleResponseSchema,
    RulesSchema,
    rule_to_rule,
    rule_to_rule_response,
)
from app.services.ecological_zoning import find_ecological_zonings_by_ids


def get_rules(db: Session) -> list[RuleResponseSchema]:
    return [rule_to_rule_response(rule) for rule in db.query(Rules).all()]


def get_rule_by_id(db: Session, id: int) -> RuleResponseSchema:
    return rule_to_rule_response(find_rule_by_id(db, id))


def update_rule(db: Session, id: int, rule: RuleBaseSchema):
    found_rule = find_rule_by_id(db, id)
    found_rule.ecological_zonings = find_ecological_zonings_by_ids(
        db, rule.ecological_zonings_ids
    )
    found_rule.threshold = rule.threshold
    db.commit()


def find_rule_by_id(db: Session, id: int) -> Rules:
    found_rule = db.get(Rules, id)
    if found_rule is None:
        raise HTTPException(status_code=404, detail=f"Rule with id {id} not found")
    return found_rule


def query_slope_rule(db: Session) -> Query[Rules]:
    return db.query(Rules).filter(Rules.type == "slope")


def query_ecological_zoning_rule(db: Session) -> Query[Rules]:
    return db.query(Rules).filter(Rules.type == "ecological_zoning")


def query_area_rule(db: Session) -> Query[Rules]:
    return db.query(Rules).filter(Rules.type == "area")


def list_rules(db: Session) -> RulesSchema:
    return RulesSchema(
        area=rule_to_rule(query_area_rule(db).first()),
        slope=rule_to_rule(query_slope_rule(db).first()),
        ecological_zoning=rule_to_rule(query_ecological_zoning_rule(db).first()),
    )
