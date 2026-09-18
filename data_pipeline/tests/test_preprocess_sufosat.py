from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
from rasterio.transform import from_origin
from shapely.geometry import box

from pipeline.scripts.preprocess_sufosat import (
    add_concave_hull_score,
    cluster_clear_cuts,
    mask_radd_alerts_to_date_band,
    union_clear_cut_clusters,
)


def squares(
    *origins: tuple[int, int],
    dates: list[str] | None = None,
    side: int = 100,
) -> gpd.GeoDataFrame:
    """Carrés de `side` mètres en Lambert 93, datés du même jour par défaut."""
    dates = dates or ["2026-09-15"] * len(origins)
    return gpd.GeoDataFrame(
        {"date": pd.to_datetime(dates)},
        geometry=[box(x, y, x + side, y + side) for x, y in origins],
        crs="EPSG:2154",
    )


def test_close_polygons_share_a_group_and_the_rest_continue_numbering() -> None:
    gdf = cluster_clear_cuts(squares((0, 0), (150, 0), (5000, 0)), 100, 365)

    groups = gdf["clear_cut_group"].tolist()
    assert groups[0] == groups[1] == 0
    assert groups[2] == 1


def test_grouping_is_transitive() -> None:
    # A touche B, B touche C, mais A et C sont à 300 m : un seul groupe.
    gdf = cluster_clear_cuts(squares((0, 0), (150, 0), (300, 0)), 100, 365)

    assert gdf["clear_cut_group"].nunique() == 1


def test_union_aggregates_dates_and_sizes() -> None:
    gdf = squares(
        (0, 0), (150, 0), (5000, 0), dates=["2026-01-01", "2026-01-31", "2026-06-01"]
    )
    gdf["clear_cut_group"] = [0, 0, 1]

    clusters = union_clear_cut_clusters(gdf)

    assert clusters.index.tolist() == [0, 1]
    assert clusters.loc[0, "clear_cut_group_size"] == 2
    assert clusters.loc[0, "days_delta"] == 30
    assert clusters.loc[0, "date_min"] == pd.Timestamp("2026-01-01")
    assert clusters.loc[0, "date_max"] == pd.Timestamp("2026-01-31")
    assert clusters.loc[1, "clear_cut_group_size"] == 1
    assert clusters.loc[1, "days_delta"] == 0
    # L'union de deux carrés disjoints garde leurs deux surfaces.
    assert clusters.loc[0, "geometry"].area > 2 * 100 * 100


def test_concave_hull_score_is_one_for_a_convex_shape() -> None:
    gdf = squares((0, 0))

    scored = add_concave_hull_score(gdf, concave_hull_ratio=1.0)

    assert scored["concave_hull_score"].iloc[0] == 1.0


def test_concave_hull_score_is_below_one_for_a_hollow_shape() -> None:
    # Un anneau : sa surface est bien plus petite que celle de son enveloppe.
    ring = box(0, 0, 100, 100).difference(box(10, 10, 90, 90))
    gdf = gpd.GeoDataFrame(
        {"date": [pd.Timestamp("2026-09-15")]}, geometry=[ring], crs="EPSG:2154"
    )

    scored = add_concave_hull_score(gdf, concave_hull_ratio=1.0)

    assert 0 < scored["concave_hull_score"].iloc[0] < 0.5


def test_isolated_polygons_each_get_their_own_group() -> None:
    # Cas d'un passage incrémental : aucun pixel voisin, donc aucune paire.
    gdf = cluster_clear_cuts(squares((0, 0), (5000, 0), (0, 5000)), 100, 365)

    assert sorted(gdf["clear_cut_group"].tolist()) == [0, 1, 2]


def test_polygons_too_far_apart_in_time_are_not_grouped() -> None:
    gdf = cluster_clear_cuts(
        squares((0, 0), (150, 0), dates=["2025-01-01", "2026-09-15"]), 100, 365
    )

    assert gdf["clear_cut_group"].nunique() == 2


def test_mask_radd_alerts_keeps_confirmed_dates_only(tmp_path: Path) -> None:
    # Bande 1 : Alert (2 = confirmée), bande 2 : Date (YYDDD).
    alert = np.array([[1, 2], [3, 0]], dtype="int16")
    date = np.array([[26010, 26020], [26030, 26040]], dtype="int16")
    source = tmp_path / "radd.tif"
    with rasterio.open(
        source,
        "w",
        driver="GTiff",
        height=2,
        width=2,
        count=2,
        dtype="int16",
        crs="EPSG:3035",
        transform=from_origin(0, 20, 10, 10),
    ) as dst:
        dst.write(alert, 1)
        dst.write(date, 2)
    masked = tmp_path / "masked.tif"

    result = mask_radd_alerts_to_date_band(str(source), str(masked))

    assert result == str(masked)
    with rasterio.open(masked) as src:
        assert src.count == 1
        assert src.nodata == 0
        assert src.read(1).tolist() == [[0, 26020], [26030, 0]]


def test_mask_radd_alerts_passes_a_single_band_raster_through(tmp_path: Path) -> None:
    source = tmp_path / "dates.tif"
    with rasterio.open(
        source,
        "w",
        driver="GTiff",
        height=1,
        width=1,
        count=1,
        dtype="int16",
        crs="EPSG:3035",
        transform=from_origin(0, 10, 10, 10),
    ) as dst:
        dst.write(np.array([[26010]], dtype="int16"), 1)

    assert mask_radd_alerts_to_date_band(str(source), str(tmp_path / "x.tif")) == str(
        source
    )
    assert not (tmp_path / "x.tif").exists()
