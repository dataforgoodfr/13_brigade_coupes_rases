from sqlalchemy.orm import Session

from app.models import (
    City,
    ClearCut,
    ClearCutForm,
    ClearCutReport,
    Department,
    EcologicalZoning,
    Rules,
    User,
)


def exists(db: Session, model: type, id: int | None) -> bool:
    return db.get(model, id, populate_existing=True) is not None


def test_deleting_a_report_keeps_shared_rows(db: Session) -> None:
    report = (
        db.query(ClearCutReport)
        .filter(
            ClearCutReport.clear_cut_forms.any(),
            ClearCutReport.rules.any(),
            ClearCutReport.user_id.is_not(None),
        )
        .first()
    )
    assert report is not None
    city_id, department_id = report.city_id, report.city.department_id
    user_ids = {report.user_id} | {form.editor_id for form in report.clear_cut_forms}
    rule_ids = {rule.id for rule in report.rules}
    form_ids = {form.id for form in report.clear_cut_forms}
    clear_cut_ids = {clear_cut.id for clear_cut in report.clear_cuts}
    zoning_ids = {
        link.ecological_zoning_id
        for clear_cut in report.clear_cuts
        for link in clear_cut.ecological_zonings
    }

    db.delete(report)
    db.flush()

    assert exists(db, City, city_id)
    assert exists(db, Department, department_id)
    assert all(exists(db, User, id) for id in user_ids)
    assert all(exists(db, Rules, id) for id in rule_ids)
    assert all(exists(db, EcologicalZoning, id) for id in zoning_ids)
    assert not any(exists(db, ClearCutForm, id) for id in form_ids)
    assert not any(exists(db, ClearCut, id) for id in clear_cut_ids)


def test_deleting_a_form_keeps_its_editor_and_report(db: Session) -> None:
    form = db.query(ClearCutForm).first()
    assert form is not None
    editor_id, report_id = form.editor_id, form.report_id

    db.delete(form)
    db.flush()

    assert exists(db, User, editor_id)
    assert exists(db, ClearCutReport, report_id)


def test_deleting_a_clear_cut_keeps_its_report_and_zonings(db: Session) -> None:
    clear_cut = db.query(ClearCut).filter(ClearCut.ecological_zonings.any()).first()
    assert clear_cut is not None
    report_id = clear_cut.report_id
    zoning_ids = {link.ecological_zoning_id for link in clear_cut.ecological_zonings}

    db.delete(clear_cut)
    db.flush()

    assert exists(db, ClearCutReport, report_id)
    assert all(exists(db, EcologicalZoning, id) for id in zoning_ids)
