import dask_geopandas
import geopandas as gpd
import pytest
from shapely.geometry import Polygon, box

from pipeline.scripts.enrich_sufosat_clusters import (
    apply_business_filters,
    overlay,
    to_reference_crs,
)


def clusters(*geoms: Polygon) -> dask_geopandas.GeoDataFrame:
    gdf = gpd.GeoDataFrame(
        {"clear_cut_group": list(range(len(geoms)))},
        geometry=list(geoms),
        crs="EPSG:2154",
    )
    return dask_geopandas.from_geopandas(gdf, npartitions=1)


def test_overlay_clips_to_the_intersection_and_keeps_right_attributes() -> None:
    cities = gpd.GeoDataFrame(
        {"code_insee": ["40001", "40002"]},
        geometry=[box(0, 0, 100, 100), box(100, 0, 200, 100)],
        crs="EPSG:2154",
    )

    result = overlay(clusters(box(50, 0, 150, 100)), cities).compute()

    assert sorted(result["code_insee"].tolist()) == ["40001", "40002"]
    assert result["clear_cut_group"].tolist() == [0, 0]
    assert result.geometry.area.tolist() == [50 * 100, 50 * 100]
    assert "right_geometry" not in result.columns


def test_overlay_drops_clusters_outside_the_reference() -> None:
    cities = gpd.GeoDataFrame(
        {"code_insee": ["40001"]}, geometry=[box(0, 0, 100, 100)], crs="EPSG:2154"
    )

    result = overlay(clusters(box(1000, 1000, 1100, 1100)), cities).compute()

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

    mismatched = overlay(dask_geopandas.from_geopandas(laea, npartitions=1), reference)
    aligned = overlay(
        dask_geopandas.from_geopandas(to_reference_crs(laea), npartitions=1),
        reference,
    )

    assert len(mismatched.compute()) == 0
    assert aligned.compute()["code_insee"].tolist() == ["40134"]


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

    assert apply_business_filters(gdf).index.tolist() == [0]


def test_business_filters_keep_small_cuts_in_natura2000_or_on_slopes() -> None:
    gdf = enriched(
        area_ha=[3.0, 3.0, 3.0],
        bdf_resinous_area_ha=[3.0, 3.0, 3.0],
        natura2000_area_ha=[0.1, None, None],
        slope_area_ha=[None, 0.2, None],
    )

    assert apply_business_filters(gdf).index.tolist() == [0, 1]


def test_business_filters_drop_cuts_under_two_hectares_and_outside_forests() -> None:
    gdf = enriched(
        area_ha=[1.9, 12.0],
        bdf_resinous_area_ha=[1.9, None],
        natura2000_area_ha=[1.0, 1.0],
    )

    assert len(apply_business_filters(gdf)) == 0


def test_business_filters_tolerate_missing_forest_type_columns() -> None:
    # La pivot_table ne crée que les colonnes des types rencontrés.
    gdf = enriched(area_ha=[12.0], bdf_resinous_area_ha=[None]).assign(
        bdf_mixed_area_ha=[12.0]
    )

    assert apply_business_filters(gdf).index.tolist() == [0]
