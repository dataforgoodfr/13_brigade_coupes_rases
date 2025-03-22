import pytest
from datetime import datetime
from geoalchemy2.elements import WKTElement
from app.models import User, Department, ClearCut
from test.common.clear_cut import new_clear_cut
from test.common.user import new_user


def test_user_creation(db):
    user = new_user()
    db.add(user)
    db.commit()

    with pytest.raises(ValueError) as exc_info:
        new_user("not_a_valid_role")

    assert str(exc_info.value) == "Role must be one of: admin, viewer, volunteer"

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
    department = Department(code="75", name="Paris")
    clear_cut = new_clear_cut(status="validated")

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
