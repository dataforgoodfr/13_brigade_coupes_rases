from datetime import datetime
from geoalchemy2 import WKTElement
import pytest
from app.models import Department, ClearCutReport, EcologicalZoning, Registry
from common.clear_cut import new_clear_cut
from common.user import new_user


def test_user_creation(db):
    user = new_user()
    db.add(user)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        new_user("not_a_valid_role")

    assert str(exc_info.value) == "Role must be one of: admin, volunteer"

    assert user.id is not None
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.deleted_at is None


def test_department_creation(db):
    department = Department(code="13", name="Bouches du Rhône")
    db.add(department)
    db.commit()

    assert department.id is not None

    with pytest.raises(ValueError) as exc_info:
        Department(code="75", name=None)
    assert str(exc_info.value) == "Name cannot be None"


def test_associations(db):
    user = new_user()
    registry = db.query(Registry).first()
    ecological_zoning = db.query(EcologicalZoning).first()
    clear_cut = new_clear_cut(
        status="validated",
        registries=[registry],
        ecological_zonings=[ecological_zoning],
    )

    user.departments.append(registry.city.department)
    user.reports.append(clear_cut)

    db.add_all([user, clear_cut])
    db.commit()

    assert registry.city.department in user.departments
    assert clear_cut in user.reports
    assert clear_cut.registries[0] == registry
    assert user in registry.city.department.users
    assert clear_cut in registry.clear_cuts
    assert clear_cut in ecological_zoning.clear_cuts


def test_clear_cut_creation(db):
    registry = db.query(Registry).first()
    ecological_zoning = db.query(EcologicalZoning).first()
    clear_cut = ClearCutReport(
        cut_date=datetime.now(),
        slope_area_ratio_percentage=15.5,
        location=WKTElement("POINT(48.8566 2.3522)"),
        boundary=WKTElement(
            "MultiPolygon(((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156)))"
        ),
        status="to_validate",
        ecological_zonings=[ecological_zoning],
        registries=[registry],
    )
    db.add(clear_cut)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        ClearCutReport(
            cut_date=datetime.now(),
            slope_area_ratio_percentage=15.5,
            location=WKTElement("POINT(48.8566 2.3522)"),
            boundary=WKTElement(
                "MultiPolygon(((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156)))"
            ),
            status="invalid_status",
        )
    assert (
        str(exc_info.value)
        == "Status must be one of: to_validate, waiting_for_validation, legal_validated, validated, final_validated"
    )

    assert clear_cut.id is not None
    assert clear_cut.created_at is not None


def test_ecological_zoning_create_without_duplicate(db):
    db.add(EcologicalZoning(code="ABC", type="Natura2000", name="ABC"))
    db.commit()
    created_ecological_zoning = (
        db.query(EcologicalZoning).filter(EcologicalZoning.code == "ABC").first()
    )
    assert created_ecological_zoning.code == "ABC"
    assert created_ecological_zoning.type == "Natura2000"
    assert created_ecological_zoning.name == "ABC"
