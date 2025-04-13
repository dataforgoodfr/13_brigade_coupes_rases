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
from app.services.tags import get_tags


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
        tags=get_tags(),
    )
