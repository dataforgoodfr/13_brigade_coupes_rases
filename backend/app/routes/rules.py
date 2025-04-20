from app.schemas.rule import RuleBaseSchema, RuleResponseSchema
from fastapi import APIRouter, Depends
from app.deps import db_session
from logging import getLogger

from app.services.rules import get_rule_by_id, get_rules, update_rule
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
    return update_rule(db, id, rule)


@router.get("/{id}", status_code=200, response_model=RuleResponseSchema)
def get_rule(id: int, db=db_session):
    logger.info(db)
    return get_rule_by_id(db, id)


@router.get("/", status_code=200, response_model=list[RuleResponseSchema])
def list_rules(db=db_session):
    logger.info(db)
    return get_rules(db)
