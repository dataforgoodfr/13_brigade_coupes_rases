from sqlalchemy.orm import Session
from app.models import Department
from logging import getLogger

from app.schemas.referential import ReferentialDepartment, ReferentialResponse
from app.services.tags import get_tags


logger = getLogger(__name__)


def get_referential(db: Session):
    departments = db.query(Department).all()

    return ReferentialResponse(
        departments={
            str(department.id): ReferentialDepartment(
                code=department.code, name=department.name
            )
            for department in departments
        },
        ecological_zonings={},
        tags=get_tags(),
    )
