from sqlalchemy.orm import Session
from app.models import Department, EcologicalZoning
from logging import getLogger

from app.schemas.ecological_zoning import (
    ecological_zoning_to_ecological_zoning_schema,
)
from app.schemas.referential import (
    ReferentialDepartmentSchema,
    ReferentialResponseSchema,
)
from app.schemas.rule import RuleResponseSchemaWithoutIdSchema
from app.services.rules import get_rules


logger = getLogger(__name__)


def get_referential(db: Session):
    departments = db.query(Department).all()
    ecological_zonings = db.query(EcologicalZoning).all()

    return ReferentialResponseSchema(
        departments={
            str(department.id): ReferentialDepartmentSchema(
                code=department.code, name=department.name
            )
            for department in departments
        },
        ecological_zonings={
            str(ecological_zoning.id): ecological_zoning_to_ecological_zoning_schema(
                ecological_zoning
            )
            for ecological_zoning in ecological_zonings
        },
        rules={
            str(rule.id): RuleResponseSchemaWithoutIdSchema(
                ecological_zonings_ids=rule.ecological_zonings_ids,
                threshold=rule.threshold,
                type=rule.type,
            )
            for rule in get_rules(db)
        },
    )
