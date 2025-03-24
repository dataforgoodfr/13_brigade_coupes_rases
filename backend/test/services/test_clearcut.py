import pytest
from datetime import date
from shapely.geometry import MultiPolygon, Point
from geoalchemy2.shape import from_shape
from app.services.clearcut import create_clearcut
from app.schemas.clearcut import ClearCutCreate
from app.models import Department, ClearCut


def test_create_clearcut_invalid_department(db):
    clearcut = ClearCutCreate(
        department_code="1024",
        cut_date=date.today(),
        slope_percentage=10,
        location=[45.0, 25.0],
        boundary=[[[[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]]]],
        address="Test Address",
        name_natura="Test Nature",
        number_natura="123",
    )

    with pytest.raises(ValueError, match="Department with code 1024 not found"):
        create_clearcut(db, clearcut)


def test_create_clearcut_with_intersection(db):
    department = db.query(Department).first()

    existing_clearcut = ClearCut(
        cut_date=date.today(),
        slope_percentage=15,
        address="42 Main St, Paris, France",
        location=from_shape(Point(1.0, 1.0), srid=4326),
        boundary=from_shape(
            MultiPolygon([[[[0.0, 0.0], [0.0, 2.0], [2.0, 2.0], [2.0, 0.0], [0.0, 0.0]]]]),
            srid=4326,
        ),
        status=ClearCut.Status.PENDING,
        department_id=department.id,
        name_natura="Existing Nature",
        number_natura="456",
    )
    db.add(existing_clearcut)
    db.commit()

    intersecting_clearcut = ClearCutCreate(
        department_code=department.code,
        cut_date=date.today(),
        slope_percentage=10,
        location=(1.5, 1.5),
        boundary=[[[(1.0, 1.0), (1.0, 3.0), (3.0, 3.0), (3.0, 1.0), (1.0, 1.0)]]],
        address="Test Address",
        name_natura="Test Nature",
        number_natura="123",
    )

    with pytest.raises(
        ValueError, match="New clearcut boundary intersects with existing clearcut ID"
    ):
        create_clearcut(db, intersecting_clearcut)


def test_create_clearcut_success(db):
    department = db.query(Department).first()

    clearcut = ClearCutCreate(
        department_code=department.code,
        cut_date=date.today(),
        slope_percentage=10,
        location=(45.0, 25.0),
        boundary=[[[(0, 0), (0, 1), (1, 1), (1, 0), (0, 0)]]],
        address="Test Address",
        name_natura="Test Nature",
        number_natura="123",
    )

    created_clearcut = create_clearcut(db, clearcut)

    assert created_clearcut.department_id == department.id
    assert created_clearcut.cut_date == clearcut.cut_date
    assert created_clearcut.slope_percentage == clearcut.slope_percentage
    assert created_clearcut.location == Point(clearcut.location)
    assert created_clearcut.boundary == MultiPolygon(clearcut.boundary)
    assert created_clearcut.address == clearcut.address
    assert created_clearcut.name_natura == clearcut.name_natura
    assert created_clearcut.number_natura == clearcut.number_natura
    assert created_clearcut.status == ClearCut.Status.PENDING
