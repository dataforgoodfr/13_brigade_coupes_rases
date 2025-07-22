from logging import getLogger

from fastapi import APIRouter, Depends

from app.deps import db_session
from app.schemas.rule import RuleBaseSchema, RuleResponseSchema, RulesUpdateSchema
from app.services.clear_cut_report import sync_clear_cuts_reports
from app.services.rules import get_rule_by_id, get_rules, update_rule, update_rules
from app.services.user_auth import get_admin_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/rules", tags=["Rules"])


@router.put("/{id}", status_code=204)
def put_rule(
    id: int,
    rule: RuleBaseSchema,
    db=db_session,
    _=Depends(get_admin_user),
):
    logger.info(db)
    if update_rule(db, id, rule):
        sync_clear_cuts_reports(db)


@router.put("", status_code=204)
def put_rules(
    rules: RulesUpdateSchema,
    db=db_session,
    _=Depends(get_admin_user),
):
    logger.info(db)
    if update_rules(db, rules):
        sync_clear_cuts_reports(db)


@router.get("/{id}", status_code=200, response_model=RuleResponseSchema)
def get_rule(id: int, db=db_session):
    logger.info(db)
    return get_rule_by_id(db, id)


@router.get("", status_code=200, response_model=list[RuleResponseSchema])
def list_rules(db=db_session):
    logger.info(db)
    return get_rules(db)
