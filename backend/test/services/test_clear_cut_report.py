from geojson_pydantic import Point, MultiPolygon
import pytest
from datetime import date
from geoalchemy2.shape import from_shape
from app.schemas.clear_cut import ClearCutCreateSchema
from app.schemas.ecological_zoning import (
    CreateEcologicalZoningSchema,
)
from app.services.clear_cut_report import create_clear_cut_report
from app.schemas.clear_cut_report import CreateClearCutsReportCreateSchema
from app.models import ClearCut
from shapely.geometry import Point as DbPoint, MultiPolygon as DbMultiPolygon

from common.clear_cut import new_clear_cut_report


def test_create_report_with_intersection(db):
    report = new_clear_cut_report()
    report.clear_cuts.append(
        ClearCut(
            observation_start_date=date.today(),
            observation_end_date=date.today(),
            area_hectare=10,
            ecological_zonings=[],
            location=from_shape(DbPoint(1.0, 1.0), srid=4326),
            boundary=from_shape(
                DbMultiPolygon(
                    [
                        [
                            [
                                [0.0, 48.0],
                                [0.0, 50.0],
                                [2.0, 50.0],
                                [2.0, 48.0],
                                [0.0, 48.0],
                            ]
                        ]
                    ]
                ),
                srid=4326,
            ),
        )
    )
    db.add(report)
    db.commit()

    intersecting_report = CreateClearCutsReportCreateSchema(
        city_zip_code="75056",
        slope_area_ratio_percentage=10,
        clear_cuts=[
            ClearCutCreateSchema(
                observation_start_date=date.today(),
                observation_end_date=date.today(),
                area_hectare=10,
                location=Point(type="Point", coordinates=[1.5, 1.5]),
                boundary=MultiPolygon(
                    type="MultiPolygon",
                    coordinates=[
                        [
                            [
                                [1.0, 49.0],
                                [1.0, 49.5],
                                [1.5, 49.5],
                                [1.5, 49.0],
                                [1.0, 49.0],
                            ]
                        ]
                    ],
                ),
                ecological_zonings=[
                    CreateEcologicalZoningSchema(
                        type="Natura2000",
                        area_hectare=10,
                        sub_type="Test subtype",
                        name="Test name",
                        code="TestCode",
                    )
                ],
            )
        ],
    )

    with pytest.raises(
        ValueError, match="New clearcut boundary intersects with existing clearcut ID"
    ):
        create_clear_cut_report(db, intersecting_report)


def test_create_report_success(db):
    report = CreateClearCutsReportCreateSchema(
        city_zip_code="75056",
        slope_area_ratio_percentage=10,
        clear_cuts=[
            ClearCutCreateSchema(
                observation_start_date=date.today(),
                observation_end_date=date.today(),
                area_hectare=10,
                location=Point(type="Point", coordinates=[1.5, 1.5]),
                boundary=MultiPolygon(
                    type="MultiPolygon",
                    coordinates=[
                        [
                            [
                                [1.0, 49.0],
                                [1.0, 49.5],
                                [1.5, 49.5],
                                [1.5, 49.0],
                                [1.0, 49.0],
                            ]
                        ]
                    ],
                ),
                ecological_zonings=[
                    CreateEcologicalZoningSchema(
                        type="Natura2000",
                        area_hectare=10,
                        sub_type="Test subtype",
                        name="Test name",
                        code="TestCode",
                    )
                ],
            )
        ],
    )
    created_report = create_clear_cut_report(db, report)
    assert created_report.city.zip_code == report.city_zip_code
    assert created_report.slope_area_ratio_percentage == report.slope_area_ratio_percentage
    ecological_zoning = created_report.clear_cuts[0].ecological_zonings[0].ecological_zoning
    assert ecological_zoning.code == report.clear_cuts[0].ecological_zonings[0].code
    assert ecological_zoning.name == report.clear_cuts[0].ecological_zonings[0].name
    assert ecological_zoning.type == report.clear_cuts[0].ecological_zonings[0].type
    assert ecological_zoning.sub_type == report.clear_cuts[0].ecological_zonings[0].sub_type

    assert created_report.status == "to_validate"
