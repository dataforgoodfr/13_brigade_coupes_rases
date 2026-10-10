from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import pyogrio
import pytest
import rasterio
from rasterio.transform import from_origin
from shapely.geometry import MultiPolygon, box

from pipeline.scripts import preprocess_sufosat
from pipeline.scripts.preprocess_sufosat import (
    add_concave_hull_score,
    append_clusters,
    cluster_pixels,
    connected_components,
    decode_dates,
    mask_alerts,
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


def date_code(date: pd.Timestamp) -> int:
    """Date au format SUFOSAT (YYDDD)."""
    return (date.year - 2000) * 1000 + date.dayofyear


def cluster(
    tmp_path: Path, pixels: gpd.GeoDataFrame, min_date: str = "2026-01-01"
) -> gpd.GeoDataFrame:
    """Les clusters des pixels, comme les écrit le prétraitement."""
    pixels_path = tmp_path / "pixels.fgb"
    pixels.assign(sufosat_date=[date_code(d) for d in pixels["date"]]).drop(
        columns="date"
    ).to_file(pixels_path)
    output = tmp_path / "clusters.gpkg"
    count = cluster_pixels(pixels_path, output, pd.Timestamp(min_date), 100, 365, 0.42)
    if count == 0:
        return gpd.GeoDataFrame()
    clusters = gpd.read_file(output).set_index("clear_cut_group").sort_index()
    assert len(clusters) == count
    return clusters


def test_sufosat_dates_count_days_from_january_first() -> None:
    # Le raster RADD contient des jours au-delà de 366
    assert decode_dates(np.array([19032, 26001, 25423])).tolist() == [
        pd.Timestamp("2019-02-01").date(),
        pd.Timestamp("2026-01-01").date(),
        pd.Timestamp("2026-02-27").date(),
    ]


def test_connected_components_follow_chains() -> None:
    # 0-1-2 et 3-4 reliés, 5 seul
    groups = connected_components(
        6, np.array([2, 1, 4], dtype=np.int64), np.array([1, 0, 3], dtype=np.int64)
    )

    assert groups[0] == groups[1] == groups[2]
    assert groups[3] == groups[4]
    assert len({groups[0], groups[3], groups[5]}) == 3


def test_close_polygons_share_a_cluster(tmp_path: Path) -> None:
    clusters = cluster(tmp_path, squares((0, 0), (150, 0), (5000, 0)))

    assert clusters["clear_cut_group_size"].sort_values().tolist() == [1, 2]


def test_grouping_is_transitive(tmp_path: Path) -> None:
    # A touche B, B touche C, mais A et C sont à 300 m : un seul cluster.
    clusters = cluster(tmp_path, squares((0, 0), (150, 0), (300, 0)))

    assert clusters["clear_cut_group_size"].tolist() == [3]


def test_clusters_aggregate_dates_and_sizes(tmp_path: Path) -> None:
    clusters = cluster(
        tmp_path,
        squares(
            (0, 0),
            (150, 0),
            (5000, 0),
            dates=["2026-01-01", "2026-01-31", "2026-06-01"],
        ),
    )

    pair = clusters[clusters["clear_cut_group_size"] == 2].iloc[0]
    single = clusters[clusters["clear_cut_group_size"] == 1].iloc[0]
    assert pair["days_delta"] == 30
    assert pair["date_min"] == pd.Timestamp("2026-01-01")
    assert pair["date_max"] == pd.Timestamp("2026-01-31")
    # L'union de deux carrés disjoints garde leurs deux surfaces.
    assert pair["area_ha"] == pytest.approx(2.0, abs=0.01)
    assert single["days_delta"] == 0
    assert single["area_ha"] == pytest.approx(1.0, abs=0.01)


def test_isolated_polygons_each_get_their_own_cluster(tmp_path: Path) -> None:
    # Cas d'un passage incrémental : aucun pixel voisin, donc aucune paire.
    clusters = cluster(tmp_path, squares((0, 0), (5000, 0), (0, 5000)))

    assert clusters.index.tolist() == [0, 1, 2]


def test_polygons_too_far_apart_in_time_are_not_grouped(tmp_path: Path) -> None:
    clusters = cluster(
        tmp_path, squares((0, 0), (150, 0), dates=["2026-01-01", "2027-06-15"])
    )

    assert len(clusters) == 2


def test_pixels_before_the_start_date_are_left_out(tmp_path: Path) -> None:
    clusters = cluster(
        tmp_path,
        squares((0, 0), (5000, 0), dates=["2025-12-31", "2026-03-01"]),
        min_date="2026-01-01",
    )

    assert clusters["date_min"].tolist() == [pd.Timestamp("2026-03-01")]


def test_no_pixel_left_gives_no_cluster(tmp_path: Path) -> None:
    clusters = cluster(tmp_path, squares((0, 0), dates=["2025-12-31"]))

    assert clusters.empty


def test_clusters_are_whole_across_bands(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Bandes de 1 km : une chaîne nord-sud de 2,5 km en traverse trois, et
    # deux carrés séparés par une limite de bande, à 50 m l'un de l'autre,
    # restent ensemble.
    monkeypatch.setattr(preprocess_sufosat, "BAND_HEIGHT_METERS", 1_000)
    chain = [(0, y) for y in range(0, 2500, 150)]
    clusters = cluster(tmp_path, squares(*chain, (5000, 850), (5000, 1000)))

    assert sorted(clusters["clear_cut_group_size"].tolist()) == [2, len(chain)]
    whole_chain = clusters[clusters["clear_cut_group_size"] == len(chain)].iloc[0]
    assert whole_chain["area_ha"] == pytest.approx(len(chain), abs=0.01)
    assert whole_chain.geometry.bounds[3] == pytest.approx(chain[-1][1] + 100, abs=0.01)


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


def write_raster(path: Path, *bands: list[list[int]], crs: str = "EPSG:3035") -> Path:
    arrays = [np.array(band, dtype="int16") for band in bands]
    height, width = arrays[0].shape
    with rasterio.open(
        path,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=len(arrays),
        dtype="int16",
        crs=crs,
        transform=from_origin(0, height * 10, 10, 10),
    ) as dst:
        for index, array in enumerate(arrays, start=1):
            dst.write(array, index)
    return path


def test_mask_alerts_keeps_confirmed_recent_dates_only(tmp_path: Path) -> None:
    # Bande 1 : Alert (2 = confirmée), bande 2 : Date (YYDDD).
    source = write_raster(
        tmp_path / "radd.tif",
        [[1, 2, 2], [3, 0, 2]],
        [[26010, 26020, 25300], [26030, 26040, 26050]],
    )
    masked = tmp_path / "masked.tif"

    assert mask_alerts(str(source), str(masked), pd.Timestamp("2026-01-01")) == str(
        masked
    )

    with rasterio.open(masked) as src:
        assert src.count == 1
        assert src.nodata == 0
        assert src.read(1).tolist() == [[0, 26020, 0], [26030, 0, 26050]]


def test_mask_alerts_filters_a_single_date_band_by_date(tmp_path: Path) -> None:
    # 25423 : 423e jour à partir du 1er janvier 2025, soit le 27 février 2026
    source = write_raster(tmp_path / "dates.tif", [[26010, 25365, 0, 25423]])
    masked = tmp_path / "masked.tif"

    mask_alerts(str(source), str(masked), pd.Timestamp("2026-01-01"))

    with rasterio.open(masked) as src:
        assert src.read(1).tolist() == [[26010, 0, 0, 25423]]


def test_mask_alerts_refuses_a_raster_in_degrees(tmp_path: Path) -> None:
    source = write_raster(tmp_path / "dates.tif", [[26010]], crs="EPSG:4326")

    with pytest.raises(ValueError, match="projeté en mètres"):
        mask_alerts(
            str(source), str(tmp_path / "masked.tif"), pd.Timestamp("2026-01-01")
        )


def test_append_clusters_keeps_one_multipolygon_layer(tmp_path: Path) -> None:
    # Une première bande sans MultiPolygon ne doit pas figer la couche en
    # POLYGON : la conversion en FlatGeobuf refuserait les bandes suivantes.
    output = tmp_path / "clusters.gpkg"
    polygons = gpd.GeoDataFrame(geometry=[box(0, 0, 100, 100)], crs="EPSG:2154")
    multipolygons = gpd.GeoDataFrame(
        geometry=[MultiPolygon([box(0, 0, 100, 100), box(300, 0, 400, 100)])],
        crs="EPSG:2154",
    )

    append_clusters(polygons, output)
    append_clusters(multipolygons, output)

    assert pyogrio.read_info(output)["geometry_type"] == "MultiPolygon"
    assert set(gpd.read_file(output).geom_type) == {"MultiPolygon"}
