from typing import Optional
from sqlalchemy import desc, extract
from app.models import City, ClearCut, ClearCutReport, Department, User
from sqlalchemy.orm import Session

from app.schemas.filters import FiltersResponseSchema
from app.schemas.tag import TAGS


def build_filters(db: Session, connected_user: Optional[User]) -> FiltersResponseSchema:
    cut_years = (
        db.query(extract("year", ClearCut.observation_end_date).label("cut_year"))
        .distinct()
        .order_by(
            desc("cut_year"),
        )
        .all()
    )
    departments_query = (
        db.query(Department.id).join(City).join(ClearCutReport).distinct()
    )
    if connected_user is not None and len(connected_user.departments) > 0:
        departments_query.join(connected_user.departments)
    departments = departments_query.all()
    statuses = db.query(ClearCutReport.status).distinct().all()
    return FiltersResponseSchema(
        area_preset_hectare=[0.5, 1, 2, 5, 10],
        cut_years=[row[0] for row in cut_years],
        departments_ids=[str(row[0]) for row in departments],
        ecological_zoning=None,
        excessive_slop=None,
        statuses=[row[0] for row in statuses],
        tags_ids=[str(tag) for tag in TAGS],
    )
