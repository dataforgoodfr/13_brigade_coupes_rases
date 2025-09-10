import pytest

from app.models import City, Department, EcologicalZoning
from test.common.clear_cut import new_clear_cut_report
from test.common.user import new_user


def test_user_creation(db):
    user = new_user(role="volunteer")
    db.add(user)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        new_user(role="not_a_valid_role")

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
    ecological_zoning = db.query(EcologicalZoning).first()
    city = db.query(City).first()
    report = new_clear_cut_report(
        status="validated", city_id=city.id, ecological_zoning_id=ecological_zoning.id
    )

    user.departments.append(city.department)
    user.reports.append(report)

    db.add_all([user, report])
    db.commit()

    assert city.department in user.departments
    assert report in user.reports
    assert user in city.department.users
    assert report.clear_cuts[0].ecological_zonings[0] in ecological_zoning.clear_cuts


def test_report_creation(db):
    ecological_zoning = db.query(EcologicalZoning).first()
    city = db.query(City).first()
    report = new_clear_cut_report(
        status="validated", city_id=city.id, ecological_zoning_id=ecological_zoning.id
    )
    db.add(report)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        new_clear_cut_report(
            status="invalid_status",
            city_id=city.id,
            ecological_zoning_id=ecological_zoning.id,
        )
    assert (
        str(exc_info.value)
        == "Status must be one of: to_validate, waiting_for_validation, legal_validated, validated, final_validated"
    )

    assert report.id is not None
    assert report.created_at is not None


def test_ecological_zoning_create_without_duplicate(db):
    db.add(EcologicalZoning(code="ABC", type="Natura2000", name="ABC"))
    db.commit()
    created_ecological_zoning = (
        db.query(EcologicalZoning).filter(EcologicalZoning.code == "ABC").first()
    )
    assert created_ecological_zoning.code == "ABC"
    assert created_ecological_zoning.type == "Natura2000"
    assert created_ecological_zoning.name == "ABC"
