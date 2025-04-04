from typing import Optional
from sqlalchemy import extract
from app.models import City, ClearCutReport, Department, User
from sqlalchemy.orm import Session

from app.schemas.tag import TAGS


def build_filters(db: Session, connected_user: Optional[User]) -> FiltersResponseSchema:
    cut_years = db.query(extract("year", ClearCutReport.cut_date)).distinct().all()
    departments = db.query(Department.id).join(City).join(ClearCutReport).all()
    statuses = db.query(ClearCutReport.status).distinct().all()
    # if connected_user is not None and len(connected_user.departments)>0 :
    # departments = [any(connected_user) for row in departments]
    return FiltersResponseSchema(
        are_preset_hectare=[0.5, 1, 2, 5, 10],
        cut_years=[row[0] for row in cut_years],
        departments=[row[0] for row in departments],
        ecological_zoning=False,
        excessive_slop=False,
        statuses=[row[0] for row in statuses],
    )
