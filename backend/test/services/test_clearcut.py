from fastapi import HTTPException
from geojson_pydantic import Point, MultiPolygon
import pytest
from datetime import date
from geoalchemy2.shape import from_shape
from app.schemas.ecological_zoning import EcologicalZoningSchema
from app.services.clear_cut_report import create_clear_cut_report
from app.schemas.clear_cut_report import CreateClearCutsReportCreateSchema
from app.models import ClearCutReport
from shapely.geometry import Point as DbPoint, MultiPolygon as DbMultiPolygon
from geoalchemy2.shape import to_shape


def test_create_clearcut_with_intersection(db):
    existing_clearcut = ClearCutReport(
        cut_date=date.today(),
        slope_area_ratio_percentage=15,
        area_hectare=10,
        location=from_shape(DbPoint(1.0, 1.0), srid=4326),
        boundary=from_shape(
            DbMultiPolygon(
                [[[[0.0, 48.0], [0.0, 50.0], [2.0, 50.0], [2.0, 48.0], [0.0, 48.0]]]]
            ),
            srid=4326,
        ),
        status="to_validate",
        registries=[],
        ecological_zonings=[],
    )
    db.add(existing_clearcut)
    db.commit()

    intersecting_clearcut = CreateClearCutsReportCreateSchema(
        cut_date=date.today(),
        slope_area_ratio_percentage=10,
        area_hectare=10,
        ecological_zonings=[],
        registries=[],
        location=Point(type="Point", coordinates=[1.5, 1.5]),
        boundary=MultiPolygon(
            type="MultiPolygon",
            coordinates=[
                [[[1.0, 49.0], [1.0, 49.5], [1.5, 49.5], [1.5, 49.0], [1.0, 49.0]]]
            ],
        ),
    )

    with pytest.raises(
        ValueError, match="New clearcut boundary intersects with existing clearcut ID"
    ):
        create_clear_cut_report(db, intersecting_clearcut)


def test_create_clearcut_success(db):
    clearcut = CreateClearCutsReportCreateSchema(
        ecological_zonings=[
            EcologicalZoningSchema(
                type="Natura2000",
                sub_type="Test subtype",
                name="Test name",
                code="TestCode",
            )
        ],
        cut_date=date.today(),
        slope_area_ratio_percentage=10,
        area_hectare=10,
        location=Point(type="Point", coordinates=[45.0, 25.0]),
        boundary=MultiPolygon(
            type="MultiPolygon",
            coordinates=[[[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]],
        ),
    )

    created_clearcut = create_clear_cut_report(db, clearcut)

    assert created_clearcut.cut_date == clearcut.cut_date
    assert (
        created_clearcut.slope_area_ratio_percentage
        == clearcut.slope_area_ratio_percentage
    )
    assert to_shape(created_clearcut.location).wkt == "POINT (45 25)"
    assert (
        to_shape(created_clearcut.boundary).wkt
        == "MULTIPOLYGON (((0 0, 0 1, 1 1, 1 0, 0 0)))"
    )
    assert (
        created_clearcut.ecological_zonings[0].code
        == clearcut.ecological_zonings[0].code
    )
    assert (
        created_clearcut.ecological_zonings[0].name
        == clearcut.ecological_zonings[0].name
    )
    assert (
        created_clearcut.ecological_zonings[0].type
        == clearcut.ecological_zonings[0].type
    )
    assert (
        created_clearcut.ecological_zonings[0].sub_type
        == clearcut.ecological_zonings[0].sub_type
    )
    assert (
        created_clearcut.registries[0].city.zip_code == clearcut.registries[0].zip_code
    )

    assert created_clearcut.status == "to_validate"
