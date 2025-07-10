import math

from app.models import City, ClearCut, ClearCutReport, Department, User
from app.schemas.filters import AreaRangeResponseSchema, FiltersResponseSchema
from sqlalchemy import desc, extract, func
from sqlalchemy.orm import Session


def build_filters(db: Session, connected_user: User | None) -> FiltersResponseSchema:
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
    area_range = db.query(
        func.min(ClearCutReport.total_area_hectare),
        func.max(ClearCutReport.total_area_hectare),
    ).first()
    if area_range is None:
        min_area, max_area = 0, 0
    else:
        min_area, max_area = area_range
    if connected_user is not None and len(connected_user.departments) > 0:
        departments_query.filter(
            Department.id.in_([dep.id for dep in connected_user.departments])
        )
    departments = departments_query.all()
    statuses = db.query(ClearCutReport.status).distinct().all()
    return FiltersResponseSchema(
        area_range=AreaRangeResponseSchema(
            min=math.floor(min_area), max=math.ceil(max_area)
        ),
        cut_years=[row[0] for row in cut_years],
        departments_ids=[str(row[0]) for row in departments],
        ecological_zoning=None,
        excessive_slop=None,
        statuses=[row[0] for row in statuses],
    )
