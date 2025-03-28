from fastapi import HTTPException
from geojson_pydantic import Point, MultiPolygon
import pytest
from datetime import date
from geoalchemy2.shape import from_shape
from app.schemas.city import CreateCity
from app.services.clearcut import create_clearcut
from app.schemas.clearcut import ClearCutCreate
from app.models import ClearCut, City as DbCity
from shapely.geometry import Point as DbPoint, MultiPolygon as DbMultiPolygon
from geoalchemy2.shape import to_shape


def test_create_clearcut_invalid_department(db):
    clearcut = ClearCutCreate(
        city=CreateCity(department_id="300", name="Test", zip_code="00001"),
        cut_date=date.today(),
        slope_percentage=10,
        location=Point(type="Point", coordinates=[45.0, 25.0]),
        boundary=MultiPolygon(
            type="MultiPolygon",
            coordinates=[[[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]],
        ),
        natura_name="Test Nature",
        natura_code="123",
    )

    with pytest.raises(HTTPException, match="City Test department not found by id 300"):
        create_clearcut(db, clearcut)


def test_create_clearcut_with_intersection(db):
    city = db.query(DbCity).first()

    existing_clearcut = ClearCut(
        cut_date=date.today(),
        slope_percentage=15,
        location=from_shape(DbPoint(1.0, 1.0), srid=4326),
        boundary=from_shape(
            DbMultiPolygon(
                [[[[0.0, 48.0], [0.0, 50.0], [2.0, 50.0], [2.0, 48.0], [0.0, 48.0]]]]
            ),
            srid=4326,
        ),
        status="to_validate",
        city_id=city.id,
        natura_name="Existing Nature",
        natura_code="456",
    )
    db.add(existing_clearcut)
    db.commit()

    intersecting_clearcut = ClearCutCreate(
        city=CreateCity(department_id="1", name="Test", zip_code="00001"),
        cut_date=date.today(),
        slope_percentage=10,
        location=Point(type="Point", coordinates=[1.5, 1.5]),
        boundary=MultiPolygon(
            type="MultiPolygon",
            coordinates=[[[[1.0, 49.0], [1.0, 49.5], [1.5, 49.5], [1.5, 49.0], [1.0, 49.0]]]],
        ),
        natura_name="Test Nature",
        natura_code="123",
    )

    with pytest.raises(
        ValueError, match="New clearcut boundary intersects with existing clearcut ID"
    ):
        create_clearcut(db, intersecting_clearcut)


def test_create_clearcut_success(db):
    clearcut = ClearCutCreate(
        city=CreateCity(department_id="15", name="Test", zip_code="00001"),
        cut_date=date.today(),
        slope_percentage=10,
        location=Point(type="Point", coordinates=[45.0, 25.0]),
        boundary=MultiPolygon(
            type="MultiPolygon",
            coordinates=[[[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]],
        ),
        natura_name="Test Nature",
        natura_code="123",
    )

    created_clearcut = create_clearcut(db, clearcut)

    assert str(created_clearcut.city.department_id) == clearcut.city.department_id
    assert created_clearcut.city.zip_code == clearcut.city.zip_code
    assert created_clearcut.city.name == clearcut.city.name
    assert created_clearcut.cut_date == clearcut.cut_date
    assert created_clearcut.slope_percentage == clearcut.slope_percentage
    assert to_shape(created_clearcut.location).wkt == "POINT (45 25)"
    assert (
        to_shape(created_clearcut.boundary).wkt == "MULTIPOLYGON (((0 0, 0 1, 1 1, 1 0, 0 0)))"
    )
    assert created_clearcut.natura_name == clearcut.natura_name
    assert created_clearcut.natura_code == clearcut.natura_code
    assert created_clearcut.status == "to_validate"
