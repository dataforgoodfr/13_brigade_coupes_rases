from fastapi import HTTPException
from sqlalchemy.orm import Session, aliased
from app.models import ClearCut, ClearCutReportForm
from fastapi import status

from logging import getLogger
from geoalchemy2.shape import to_shape

from app.schemas.clear_cut_report_form import (
    ClearCutReportFormBase,
    ClearCutReportFormWithStrategyResponse,
)


logger = getLogger(__name__)


def get_clearcut_report(db: Session, report_id: int):
    clearcut_report_form_alias = aliased(ClearCutReportForm)

    # Get dynamicaly ClearCutReport and ClearCut columns, except id for clearcutreport
    clearcut_columns = [getattr(ClearCut, col.name) for col in ClearCut.__table__.columns]
    report_columns = [
        getattr(clearcut_report_form_alias, col.name)
        for col in ClearCutReportForm.__table__.columns
        if col.name != "id"
    ]
    columns = [*clearcut_columns, *report_columns]

    # Request all columns
    result = (
        db.query(*columns)
        .select_from(ClearCut)
        .outerjoin(
            clearcut_report_form_alias, ClearCut.id == clearcut_report_form_alias.clear_cut_id
        )
        .filter(ClearCut.id == report_id)
        .first()
    )

    # Convert SQLAlchemy result in dict
    data = dict(result._mapping)

    # TODO: Iterate over columns
    clearcut_data_report = {}
    for col in ClearCut.__table__.columns:
        clearcut_data_report[col.name] = data[col.name]

    for col in ClearCutReportForm.__table__.columns:
        if data[col.name] is not None:
            clearcut_data_report[col.name] = data[col.name]

    clearcut_data_report["location"] = to_shape(clearcut_data_report["location"])
    clearcut_data_report["boundary"] = to_shape(clearcut_data_report["boundary"])

    clearcut_data_report["location"] = clearcut_data_report["location"].coords[0]
    clearcut_data_report["boundary"] = list(clearcut_data_report["boundary"].exterior.coords)

    return clearcut_data_report


def get_clearcut_report_form_by_id(
    db: Session, report_form_id: int
) -> ClearCutReportFormWithStrategyResponse:
    report_form = db.get(ClearCutReportForm, report_form_id)
    if report_form is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Report form not found by id {id}"
        )
    return report_form


def update_clearcut_report_form_by_id(
    db: Session, report_form_id: int, clearcutReportIn: ClearCutReportFormBase
):
    # clearcutReport = db.query(ClearCutReportForm).filter(ClearCutReportForm.report == report_id).first()
    report_form = get_clearcut_report_form_by_id(db, report_form_id)
    if not report_form:
        raise HTTPException(status_code=404, detail=f"Report form not found by id {id}")
    update_data = clearcutReportIn.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report_form, key, value)
    db.commit()
    return get_clearcut_report_form_by_id(db, report_form_id)
