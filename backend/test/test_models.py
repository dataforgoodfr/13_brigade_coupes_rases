import pytest
from datetime import datetime
from geoalchemy2.elements import WKTElement
from app.models import User, Department, ClearCut


def test_user_creation(db):
    # Test basic user creation
    user = User(firstname="John", lastname="Doe", email="john.doe@example.com", role="user")
    db.add(user)
    db.commit()

    assert user.id is not None
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.deleted_at is None


def test_department_creation(db):
    # Test department creation
    department = Department(code="DEP001")
    db.add(department)
    db.commit()

    assert department.id is not None


def test_clear_cut_creation(db):
    # Test clear cut creation with geometry
    clear_cut = ClearCut(
        cut_date=datetime.now(),
        slope_percentage=15.5,
        location=WKTElement("POINT(45.5 -122.7)"),
        boundary=WKTElement("POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))"),
        status="pending",
    )
    db.add(clear_cut)
    db.commit()

    assert clear_cut.id is not None
    assert clear_cut.created_at is not None


def test_associations(db):
    # Create test data
    user = User(
        firstname="Jane", lastname="Smith", email="jane.smith@example.com", role="manager"
    )
    department = Department(code="DEP002")
    clear_cut = ClearCut(
        cut_date=datetime.now(),
        slope_percentage=20.0,
        location=WKTElement("POINT(45.5 -122.7)"),
        boundary=WKTElement("POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))"),
        status="approved",
    )

    # Test associations
    user.departments.append(department)
    user.clear_cuts.append(clear_cut)
    clear_cut.department = department

    db.add_all([user, department, clear_cut])
    db.commit()

    # Verify associations
    assert department in user.departments
    assert clear_cut in user.clear_cuts
    assert clear_cut.department == department
    assert user in department.users
    assert clear_cut in department.clear_cuts
