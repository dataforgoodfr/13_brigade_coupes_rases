from pathlib import Path

import geopandas as gpd
import pandas as pd
import pytest
from shapely.geometry import Polygon, box

from pipeline.scripts import enrich_sufosat_clusters
from pipeline.scripts.enrich_sufosat_clusters import (
    business_filters_mask,
    enrich_clusters_file,
    overlay,
    to_reference_crs,
)


def clusters(*geoms: Polygon) -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(
        {"clear_cut_group": list(range(len(geoms)))},
        geometry=list(geoms),
        crs="EPSG:2154",
    ).set_index("clear_cut_group")


def test_overlay_clips_to_the_intersection_and_keeps_right_attributes() -> None:
    cities = gpd.GeoDataFrame(
        {"code_insee": ["40001", "40002"]},
        geometry=[box(0, 0, 100, 100), box(100, 0, 200, 100)],
        crs="EPSG:2154",
    )

    result = overlay(clusters(box(50, 0, 150, 100)), cities)

    assert sorted(result["code_insee"].tolist()) == ["40001", "40002"]
    assert result.index.tolist() == [0, 0]
    assert result.geometry.area.tolist() == [50 * 100, 50 * 100]
    assert "right_geometry" not in result.columns


def test_overlay_drops_clusters_outside_the_reference() -> None:
    cities = gpd.GeoDataFrame(
        {"code_insee": ["40001"]}, geometry=[box(0, 0, 100, 100)], crs="EPSG:2154"
    )

    result = overlay(clusters(box(1000, 1000, 1100, 1100)), cities)

    assert len(result) == 0


# Carré de 1 km dans les Landes, Lambert 93.
SQUARE_L93 = gpd.GeoDataFrame(
    {"clear_cut_group": [0]},
    geometry=[box(370_000, 6_340_000, 371_000, 6_341_000)],
    crs="EPSG:2154",
).set_index("clear_cut_group")


def test_to_reference_crs_reprojects_the_radd_export() -> None:
    laea = SQUARE_L93.to_crs("EPSG:3035")

    aligned = to_reference_crs(laea)

    assert aligned.crs.to_epsg() == 2154
    # Aller-retour de projection : quelques m² d'écart au plus.
    assert (
        aligned.geometry.iloc[0].symmetric_difference(SQUARE_L93.geometry.iloc[0]).area
        < 1
    )


def test_to_reference_crs_keeps_lambert93_untouched() -> None:
    assert to_reference_crs(SQUARE_L93) is SQUARE_L93


def test_to_reference_crs_refuses_missing_crs() -> None:
    with pytest.raises(ValueError):
        to_reference_crs(SQUARE_L93.set_crs(None, allow_override=True))


def test_overlay_finds_the_reference_only_once_aligned() -> None:
    # Des clusters en EPSG:3035 contre une couche en Lambert 93 : rien ne matche.
    reference = SQUARE_L93.reset_index(drop=True).assign(code_insee="40134")
    laea = SQUARE_L93.to_crs("EPSG:3035")

    mismatched = overlay(laea, reference)
    aligned = overlay(to_reference_crs(laea), reference)

    assert len(mismatched) == 0
    assert aligned["code_insee"].tolist() == ["40134"]


def enriched(**columns: list[float | None]) -> gpd.GeoDataFrame:
    """Clusters enrichis minimaux ; les colonnes absentes valent NaN."""
    n = len(next(iter(columns.values())))
    return gpd.GeoDataFrame(
        {
            "natura2000_area_ha": [None] * n,
            "slope_area_ha": [None] * n,
            "bdf_resinous_area_ha": [None] * n,
        }
        | columns,
        geometry=[box(0, 0, 10, 10)] * n,
        crs="EPSG:2154",
    )


def test_business_filters_keep_large_forest_cuts() -> None:
    gdf = enriched(area_ha=[12.0, 9.9], bdf_resinous_area_ha=[12.0, 9.9])

    assert gdf[business_filters_mask(gdf)].index.tolist() == [0]


def test_business_filters_keep_small_cuts_in_natura2000_or_on_slopes() -> None:
    gdf = enriched(
        area_ha=[3.0, 3.0, 3.0],
        bdf_resinous_area_ha=[3.0, 3.0, 3.0],
        natura2000_area_ha=[0.1, None, None],
        slope_area_ha=[None, 0.2, None],
    )

    assert gdf[business_filters_mask(gdf)].index.tolist() == [0, 1]


def test_business_filters_drop_cuts_under_two_hectares_and_outside_forests() -> None:
    gdf = enriched(
        area_ha=[1.9, 12.0],
        bdf_resinous_area_ha=[1.9, None],
        natura2000_area_ha=[1.0, 1.0],
    )

    assert business_filters_mask(gdf).sum() == 0


def test_business_filters_tolerate_missing_forest_type_columns() -> None:
    # La pivot_table ne crée que les colonnes des types rencontrés.
    gdf = enriched(area_ha=[12.0], bdf_resinous_area_ha=[None]).assign(
        bdf_mixed_area_ha=[12.0]
    )

    assert gdf[business_filters_mask(gdf)].index.tolist() == [0]


def write_layer(path: Path, geoms: list[Polygon], **columns: list[str]) -> Path:
    gpd.GeoDataFrame(columns, geometry=geoms, crs="EPSG:2154").to_file(path)
    return path


@pytest.fixture
def reference_layers(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Couches de référence minimales, et des zones de 1 km pour que les
    clusters ci-dessous se répartissent sur plusieurs zones."""
    module = enrich_sufosat_clusters
    monkeypatch.setattr(module, "ZONE_SIZE_METERS", 1_000)
    monkeypatch.setattr(module, "NEAREST_CITY_SEARCH_METERS", 100)
    layers = {
        "CITIES_PATH": write_layer(
            tmp_path / "cities.fgb",
            [box(0, 0, 1000, 1000), box(1000, 0, 2000, 1000), box(5000, 0, 5100, 100)],
            code_insee=["40001", "40002", "40003"],
        ),
        # Deux morceaux contigus de l'union : leurs surfaces s'additionnent
        "NATURA2000_UNION_PATH": write_layer(
            tmp_path / "natura2000_union.fgb",
            [box(900, 100, 1000, 300), box(1000, 100, 1050, 300)],
        ),
        "NATURA2000_CONCAT_PATH": write_layer(
            tmp_path / "natura2000_concat.fgb",
            [box(0, 0, 2000, 1000)],
            code=["FR7200001"],
        ),
        "BDFORET_PATH": write_layer(
            tmp_path / "bdforet.fgb",
            [box(0, 0, 1000, 1000), box(1000, 0, 2000, 2000)],
            bdf_type=["resinous", "deciduous"],
        ),
        "SLOPE_PATH": write_layer(
            tmp_path / "slope.fgb",
            [box(900, 100, 950, 150), box(1000, 100, 1100, 200)],
        ),
    }
    for name, path in layers.items():
        monkeypatch.setattr(module, name, path)


def write_clusters(path: Path, *geoms: Polygon) -> Path:
    gdf = clusters(*geoms).reset_index()
    gdf["area_ha"] = gdf.area / 10000
    gdf.to_file(path)
    return path


@pytest.mark.usefixtures("reference_layers")
def test_enrich_measures_each_cluster_whatever_its_zone(tmp_path: Path) -> None:
    # Le premier cluster est à cheval sur deux zones et deux communes ; le
    # deuxième, dans une autre zone, ne touche aucune commune ; le dernier
    # fait moins de 2 ha.
    path = write_clusters(
        tmp_path / "clusters.fgb",
        box(900, 100, 1100, 300),
        box(1600, 1200, 2100, 1700),
        box(500, 500, 600, 600),
    )

    result = enrich_clusters_file(path)

    assert sorted(result.index) == [0, 1]
    straddling, isolated = result.loc[0], result.loc[1]
    assert sorted(straddling["cities"]) == ["40001", "40002"]
    assert straddling["natura2000_area_ha"] == pytest.approx(3.0)
    assert straddling["natura2000_codes"] == ["FR7200001"]
    assert straddling["bdf_resinous_area_ha"] == pytest.approx(2.0)
    assert straddling["bdf_deciduous_area_ha"] == pytest.approx(2.0)
    # Plus grand seul tenant en pente, pas la somme des deux
    assert straddling["slope_area_ha"] == pytest.approx(1.0)
    assert isolated["cities"] == ["40002"]  # commune la plus proche
    assert pd.isna(isolated["natura2000_area_ha"])
    assert pd.isna(isolated["slope_area_ha"])
    assert result.columns.tolist() == [
        "area_ha",
        "geometry",
        "cities",
        "natura2000_area_ha",
        "natura2000_codes",
        "bdf_deciduous_area_ha",
        "bdf_mixed_area_ha",
        "bdf_poplar_area_ha",
        "bdf_resinous_area_ha",
        "slope_area_ha",
    ]


@pytest.mark.usefixtures("reference_layers")
def test_enrich_keeps_nothing_when_no_cluster_passes(tmp_path: Path) -> None:
    path = write_clusters(tmp_path / "clusters.fgb", box(500, 500, 600, 600))

    assert enrich_clusters_file(path).empty
