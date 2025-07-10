from functools import reduce

from fastapi import HTTPException
from sqlalchemy.orm import Query, Session

from app.models import Rules
from app.schemas.rule import (
    AllRules,
    RuleBaseSchema,
    RuleResponseSchema,
    RulesUpdateSchema,
    rule_to_rule_response,
)
from app.services.ecological_zoning import find_ecological_zonings_by_ids


def get_rules(db: Session) -> list[RuleResponseSchema]:
    return [rule_to_rule_response(rule) for rule in db.query(Rules).all()]


def get_rule_by_id(db: Session, id: int) -> RuleResponseSchema:
    return rule_to_rule_response(find_rule_by_id(db, id))


def update_rule(db: Session, id: int, rule: RuleBaseSchema) -> bool:
    found_rule = find_rule_by_id(db, id)
    ecological_zoning_diff_count = len(
        {ecological_zoning.id for ecological_zoning in found_rule.ecological_zonings}
        - {int(id) for id in rule.ecological_zonings_ids}
    )
    has_threshold_changed = found_rule.threshold != rule.threshold
    found_rule.ecological_zonings = find_ecological_zonings_by_ids(
        db, rule.ecological_zonings_ids
    )
    found_rule.threshold = rule.threshold
    db.commit()
    return ecological_zoning_diff_count > 0 or has_threshold_changed


def update_rules(db: Session, rules: RulesUpdateSchema) -> bool:
    updated_rules = []
    for rule in rules.rules:
        updated_rules.append(update_rule(db, rule.id, rule))

    db.flush()
    return reduce(
        lambda has_changed, current_changed: has_changed and current_changed,
        updated_rules,
        False,
    )


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


def list_rules(db: Session) -> AllRules:
    area_rule = query_area_rule(db).first()
    slope_rule = query_slope_rule(db).first()
    ecological_zoning_rule = query_ecological_zoning_rule(db).first()

    if area_rule is None or slope_rule is None or ecological_zoning_rule is None:
        raise HTTPException(
            status_code=404, detail="One or more required rules not found"
        )

    return AllRules(
        area=area_rule,
        slope=slope_rule,
        ecological_zoning=ecological_zoning_rule,
    )
