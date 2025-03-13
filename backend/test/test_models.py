import pytest
from datetime import datetime
from geoalchemy2.elements import WKTElement
from app.models import User, Department, ClearCut


def test_user_creation(db):
    user = User(
        firstname="Tétras", lastname="Foret", email="tetras.foret@example.com", role="volunteer"
    )
    db.add(user)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        User(
            firstname="Invalid",
            lastname="User",
            email="invalid.user@example.com",
            role="not_a_valid_role",
        )
    assert str(exc_info.value) == "Role must be one of: admin, viewer, volunteer"

    assert user.id is not None
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.deleted_at is None


def test_department_creation(db):
    department = Department(code=75)
    db.add(department)
    db.commit()

    assert department.id is not None


def test_clear_cut_creation(db):
    clear_cut = ClearCut(
        cut_date=datetime.now(),
        slope_percentage=15.5,
        location=WKTElement("POINT(48.8566 2.3522)"),
        boundary=WKTElement(
            "POLYGON((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156))"
        ),
        status="pending",
    )
    db.add(clear_cut)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        ClearCut(
            cut_date=datetime.now(),
            slope_percentage=15.5,
            location=WKTElement("POINT(48.8566 2.3522)"),
            boundary=WKTElement(
                "POLYGON((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156))"
            ),
            status="invalid_status",
        )
    assert str(exc_info.value) == "Status must be one of: pending, validated"

    assert clear_cut.id is not None
    assert clear_cut.created_at is not None


def test_associations(db):
    user = User(
        firstname="Houba",
        lastname="Houba",
        email="houba.houba@marsupilami.com",
        role="volunteer",
    )
    department = Department(code="75", name="Paris")
    clear_cut = ClearCut(
        cut_date=datetime.now(),
        slope_percentage=20.0,
        location=WKTElement("POINT(48.8566 2.3522)"),
        boundary=WKTElement(
            "POLYGON((2.2241 48.8156, 2.4699 48.8156, 2.4699 48.9021, 2.2241 48.9021, 2.2241 48.8156))"
        ),
        status="validated",
    )

    user.departments.append(department)
    user.clear_cuts.append(clear_cut)
    clear_cut.department = department

    db.add_all([user, department, clear_cut])
    db.commit()

    assert department in user.departments
    assert clear_cut in user.clear_cuts
    assert clear_cut.department == department
    assert user in department.users
    assert clear_cut in department.clear_cuts
