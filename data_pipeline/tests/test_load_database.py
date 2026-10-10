import os
from collections.abc import Iterator
from datetime import datetime
from typing import Any

import geopandas as gpd
import pandas as pd
import pytest
from shapely.geometry import MultiPolygon, Polygon, box
from sqlalchemy import Engine, text

from pipeline.scripts import load_database as loader
from pipeline.scripts.database import create_db_engine
from pipeline.scripts.load_database import (
    capped_areas,
    load_clusters,
    parse_list,
    sync_reports,
)

# Un coin de Corse en Lambert 93, loin des coupes des autres tests
ORIGIN_X, ORIGIN_Y = 1_210_000, 6_120_000
CITY_CODE = "99901"
ZONING_CODE = "FR9999901"


def square(offset_m: float, size_m: float = 200) -> MultiPolygon:
    x = ORIGIN_X + offset_m
    return MultiPolygon([box(x, ORIGIN_Y, x + size_m, ORIGIN_Y + size_m)])


def clusters(rows: list[dict[str, Any]]) -> gpd.GeoDataFrame:
    defaults = {
        "date_min": datetime(2026, 7, 1),
        "date_max": datetime(2026, 9, 1),
        "area_ha": 4.0,
        "cities": f"['{CITY_CODE}']",
        "natura2000_area_ha": None,
        "natura2000_codes": None,
        "bdf_resinous_area_ha": 3.0,
        "bdf_deciduous_area_ha": None,
        "bdf_mixed_area_ha": None,
        "bdf_poplar_area_ha": None,
        "slope_area_ha": None,
    }
    return gpd.GeoDataFrame(
        [{**defaults, **row} for row in rows], geometry="geometry", crs="EPSG:2154"
    )


def empty() -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(geometry=[], crs="EPSG:2154")


class TestParseList:
    def test_reads_back_a_stringified_list(self) -> None:
        assert parse_list("['40185', '40250']") == ["40185", "40250"]

    def test_missing_values_are_empty(self) -> None:
        assert parse_list(None) == []
        assert parse_list(float("nan")) == []

    def test_plain_value_is_a_single_item(self) -> None:
        assert parse_list("40185") == ["40185"]


class TestCappedAreas:
    def test_forest_areas_are_scaled_down_to_the_cut_area(self) -> None:
        row = pd.Series(
            {"area_ha": 3.0, "bdf_resinous_area_ha": 2.0, "bdf_deciduous_area_ha": 2.0}
        )
        areas = capped_areas(row)
        assert areas["bdf_resinous_area_ha"] == pytest.approx(1.5)
        assert areas["bdf_deciduous_area_ha"] == pytest.approx(1.5)
        assert areas["bdf_mixed_area_ha"] is None

    def test_natura2000_area_is_capped(self) -> None:
        row = pd.Series({"area_ha": 3.05, "natura2000_area_ha": 3.0519})
        assert capped_areas(row)["natura2000_area_ha"] == 3.05

    def test_areas_within_the_cut_are_kept(self) -> None:
        row = pd.Series({"area_ha": 4.0, "bdf_resinous_area_ha": 3.0})
        assert capped_areas(row)["bdf_resinous_area_ha"] == 3.0


def test_loading_needs_the_backend_to_recompute_reports(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("API_URL", raising=False)
    monkeypatch.delenv("IMPORTS_TOKEN", raising=False)
    with pytest.raises(RuntimeError, match="API_URL"):
        loader.load_database()


def test_sync_reports_sends_the_imports_token(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []

    class Response:
        def raise_for_status(self) -> None:
            pass

    def post(url: str, **kwargs: object) -> Response:
        calls.append((url, kwargs["headers"]))
        return Response()

    monkeypatch.setattr("pipeline.scripts.load_database.requests.post", post)
    sync_reports("https://api.example.org/", "secret")
    assert calls == [
        (
            "https://api.example.org/api/v1/clear-cuts-reports/sync-reports",
            {"x-imports-token": "secret"},
        )
    ]


TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
database = pytest.mark.skipif(
    not TEST_DATABASE_URL, reason="TEST_DATABASE_URL non défini"
)


def cleanup(engine: Engine) -> None:
    with engine.begin() as conn:
        report_ids = text(
            "SELECT r.id FROM clear_cuts_reports r JOIN cities c ON c.id = r.city_id "
            "WHERE c.zip_code = :code"
        )
        conn.execute(
            text(
                "DELETE FROM clear_cut_ecological_zoning WHERE clear_cut_id IN "
                f"(SELECT id FROM clear_cuts WHERE report_id IN ({report_ids}))"
            ),
            {"code": CITY_CODE},
        )
        conn.execute(
            text(f"DELETE FROM clear_cuts WHERE report_id IN ({report_ids})"),
            {"code": CITY_CODE},
        )
        conn.execute(
            text(f"DELETE FROM clear_cuts_reports WHERE id IN ({report_ids})"),
            {"code": CITY_CODE},
        )
        conn.execute(
            text("DELETE FROM cities WHERE zip_code = :code"), {"code": CITY_CODE}
        )
        conn.execute(text("DELETE FROM departments WHERE code = '999'"))
        conn.execute(
            text("DELETE FROM ecological_zonings WHERE code = :code"),
            {"code": ZONING_CODE},
        )


@pytest.fixture
def engine() -> Iterator[Engine]:
    assert TEST_DATABASE_URL
    engine = create_db_engine(TEST_DATABASE_URL)
    cleanup(engine)
    with engine.begin() as conn:
        department_id = conn.execute(
            text(
                "INSERT INTO departments (code, name) VALUES ('999', 'Essai') RETURNING id"
            )
        ).scalar_one()
        conn.execute(
            text(
                "INSERT INTO cities (zip_code, name, department_id) "
                "VALUES (:code, 'Essai', :department)"
            ),
            {"code": CITY_CODE, "department": department_id},
        )
        conn.execute(
            text(
                "INSERT INTO ecological_zonings (type, name, code) "
                "VALUES ('Natura 2000', 'Essai', :code)"
            ),
            {"code": ZONING_CODE},
        )
    yield engine
    cleanup(engine)
    engine.dispose()


def loaded_cuts(engine: Engine) -> list[dict[str, Any]]:
    with engine.connect() as conn:
        return [
            dict(row._mapping)
            for row in conn.execute(
                text(
                    """
                    SELECT cc.id, cc.report_id, r.status, cc.area_hectare,
                           cc.observation_end_date, cc.ecological_zoning_area_hectare,
                           ST_Area(cc.boundary::geography) / 10000 AS boundary_ha,
                           ARRAY(SELECT ez.code FROM clear_cut_ecological_zoning l
                                 JOIN ecological_zonings ez ON ez.id = l.ecological_zoning_id
                                 WHERE l.clear_cut_id = cc.id) AS zonings
                    FROM clear_cuts cc
                    JOIN clear_cuts_reports r ON r.id = cc.report_id
                    JOIN cities c ON c.id = r.city_id
                    WHERE c.zip_code = :code
                    ORDER BY cc.id
                    """
                ),
                {"code": CITY_CODE},
            )
        ]


@database
class TestLoadClusters:
    def test_a_new_cluster_becomes_a_report_to_validate(self, engine: Engine) -> None:
        new = clusters(
            [
                {
                    "geometry": square(0),
                    "natura2000_area_ha": 4.2,
                    "natura2000_codes": f"['{ZONING_CODE}', 'FR0000000']",
                }
            ]
        )
        summary = load_clusters(engine, new, empty())

        assert summary.inserted == 1
        [cut] = loaded_cuts(engine)
        assert cut["status"] == "to_validate"
        assert cut["zonings"] == [ZONING_CODE]
        assert cut["ecological_zoning_area_hectare"] == 4.0
        assert cut["boundary_ha"] == pytest.approx(4.0, rel=0.05)

    def test_loading_twice_adds_nothing(self, engine: Engine) -> None:
        new = clusters([{"geometry": square(0)}])
        load_clusters(engine, new, empty())
        summary = load_clusters(engine, new, empty())

        assert summary.inserted == 0
        assert summary.already_loaded == 1
        assert len(loaded_cuts(engine)) == 1

    def test_a_cluster_without_known_city_is_skipped(self, engine: Engine) -> None:
        new = clusters([{"geometry": square(0), "cities": "['00000']"}])
        summary = load_clusters(engine, new, empty())

        assert summary.without_city == 1
        assert loaded_cuts(engine) == []

    def test_dry_run_writes_nothing(self, engine: Engine) -> None:
        new = clusters([{"geometry": square(0)}])
        summary = load_clusters(engine, new, empty(), dry_run=True)

        assert summary.inserted == 1
        assert loaded_cuts(engine) == []

    def test_an_update_keeps_the_report_and_its_status(self, engine: Engine) -> None:
        load_clusters(engine, clusters([{"geometry": square(0)}]), empty())
        [cut] = loaded_cuts(engine)
        with engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE clear_cuts_reports SET status = 'in_progress' WHERE id = :id"
                ),
                {"id": cut["report_id"]},
            )

        updated = clusters(
            [
                {
                    "clear_cut_group": cut["id"],
                    "geometry": square(0, size_m=300),
                    "area_ha": 9.0,
                    "date_max": datetime(2026, 9, 28),
                }
            ]
        )
        summary = load_clusters(engine, empty(), updated)

        assert summary.updated == 1
        [after] = loaded_cuts(engine)
        assert after["report_id"] == cut["report_id"]
        assert after["status"] == "in_progress"
        assert after["area_hectare"] == 9.0
        assert after["observation_end_date"] == datetime(2026, 9, 28)
        assert after["boundary_ha"] == pytest.approx(9.0, rel=0.05)

    def test_a_cut_corrected_by_hand_is_not_updated(self, engine: Engine) -> None:
        load_clusters(engine, clusters([{"geometry": square(0)}]), empty())
        [cut] = loaded_cuts(engine)
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE clear_cuts SET is_manually_edited = true WHERE id = :id"),
                {"id": cut["id"]},
            )

        updated = clusters(
            [{"clear_cut_group": cut["id"], "geometry": square(0, 300), "area_ha": 9.0}]
        )
        summary = load_clusters(engine, empty(), updated)

        assert summary.locked == 1
        assert loaded_cuts(engine)[0]["area_hectare"] == 4.0

    def test_an_update_never_shrinks_below_recorded_forest_area(
        self, engine: Engine
    ) -> None:
        load_clusters(engine, clusters([{"geometry": square(0)}]), empty())
        [cut] = loaded_cuts(engine)

        updated = clusters(
            [{"clear_cut_group": cut["id"], "geometry": square(0), "area_ha": 2.0}]
        )
        load_clusters(engine, empty(), updated)

        assert loaded_cuts(engine)[0]["area_hectare"] == 3.0

    def test_self_intersecting_boundaries_are_repaired(self, engine: Engine) -> None:
        # Deux carrés qui ne se touchent que par un coin, en un seul anneau
        x, y = ORIGIN_X, ORIGIN_Y
        bowtie = Polygon(
            [
                (x, y),
                (x + 100, y),
                (x + 100, y + 100),
                (x + 200, y + 100),
                (x + 200, y + 200),
                (x + 100, y + 200),
                (x + 100, y + 100),
                (x, y + 100),
            ]
        )
        assert not bowtie.is_valid
        load_clusters(
            engine,
            clusters([{"geometry": MultiPolygon([bowtie]), "area_ha": 2.0}]),
            empty(),
        )

        with engine.connect() as conn:
            valid = conn.execute(
                text(
                    "SELECT bool_and(ST_IsValid(cc.boundary)) FROM clear_cuts cc "
                    "JOIN clear_cuts_reports r ON r.id = cc.report_id "
                    "JOIN cities c ON c.id = r.city_id WHERE c.zip_code = :code"
                ),
                {"code": CITY_CODE},
            ).scalar_one()
        assert valid is True
        assert loaded_cuts(engine)[0]["boundary_ha"] == pytest.approx(2.0, rel=0.05)
