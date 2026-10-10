import logging
from pathlib import Path
from typing import cast

import geopandas as gpd
import numpy as np
import numpy.typing as npt
import pandas as pd
import pyogrio
import rasterio

from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import log_execution, polygonize_raster, to_flatgeobuf

SUFOSAT_DIR = DATA_DIR / "sufosat"
RESULT_FILEPATH = SUFOSAT_DIR / "sufosat_clusters.fgb"
# Les alertes antérieures ne sont pas suivies par la brigade : le premier
# passage (base vide) part de cette date.
MIN_CLEARCUT_DATE = pd.Timestamp("2026-01-01")

# Les polygones de pixels de la France entière ne tiennent pas en mémoire
# (15 millions en 2026). Ils sont traités par bandes horizontales de cette
# hauteur, dans la projection du raster.
BAND_HEIGHT_METERS = 25_000

Bounds = tuple[float, float, float, float]
IntArray = npt.NDArray[np.int64]


def mask_alerts(
    input_raster_dates: str, masked_raster_dates: str, min_date: pd.Timestamp
) -> str:
    """
    Ne garde que les alertes datées de `min_date` ou après, dans un raster
    mono-bande écrit bloc par bloc.

    Les alertes plus anciennes seraient écartées après la polygonisation : sur
    la France, elles représentent 89 % des pixels en 2026, et autant de
    polygones à écrire puis relire. Un polygone ne regroupe que des pixels de
    même date : en masquer une ne change pas les polygones des autres.

    Convention d'entrée : soit la seule bande Date (YYDDD) exportée d'Earth
    Engine, soit un raster RADD brut à deux bandes, Alert puis Date, dont
    seules les alertes confirmées (Alert >= 2) sont gardées.

    Le raster doit être projeté en mètres : les distances du regroupement
    (`max_meters_between_clear_cuts`, bandes de BAND_HEIGHT_METERS) sont
    lues dans ses unités, et des degrés les fausseraient sans erreur.
    """
    with rasterio.open(input_raster_dates) as src:
        if (
            src.crs is None
            or not src.crs.is_projected
            or src.crs.linear_units != "metre"
        ):
            raise ValueError(
                f"{input_raster_dates} doit être projeté en mètres "
                f"(EPSG:3035 par exemple), pas en {src.crs}"
            )
        date_band_index = 2 if src.count >= 2 else 1
        profile = src.profile.copy()
        profile.update(count=1, nodata=0, compress="lzw")

        with rasterio.open(masked_raster_dates, "w", **profile) as dst:
            for _, window in src.block_windows(1):
                date_band = src.read(date_band_index, window=window)
                keep = (date_band > 0) & (
                    decode_dates(date_band) >= np.datetime64(min_date.date())
                )
                if date_band_index == 2:
                    keep &= src.read(1, window=window) >= 2
                masked = np.where(keep, date_band, 0).astype(date_band.dtype)
                dst.write(masked, 1, window=window)

    return masked_raster_dates


def decode_dates(codes: npt.NDArray[np.integer]) -> npt.NDArray[np.datetime64]:
    """
    Dates SUFOSAT (YYDDD) en dates numpy : 19032 donne le 1er février 2019,
    32e jour de l'année.

    Le raster RADD contient quelques jours au-delà de 366 (25423 en 2026) :
    ils comptent à partir du 1er janvier de l'année, donc 25423 tombe le
    27 février 2026.
    """
    codes = codes.astype(np.int64)
    january_first = (codes // 1000 + 2000 - 1970).astype("datetime64[Y]")
    days: npt.NDArray[np.datetime64] = january_first.astype("datetime64[D]") + (
        codes % 1000 - 1
    )
    return days


def horizontal_bands(bounds: Bounds) -> list[tuple[float, float]]:
    """Bandes de BAND_HEIGHT_METERS couvrant `bounds`, du sud au nord."""
    _, miny, _, maxy = bounds
    bands = []
    y = miny
    while y <= maxy:
        bands.append((y, y + BAND_HEIGHT_METERS))
        y += BAND_HEIGHT_METERS
    return bands


def read_pixels(
    pixels_path: Path, bounds: Bounds, min_date: pd.Timestamp
) -> tuple[gpd.GeoDataFrame, npt.NDArray[np.float64]]:
    """Les polygones de pixels datés de `min_date` ou après qui touchent
    `bounds`, indexés par leur numéro d'entité, et le bas de chacun."""
    pixels = gpd.read_file(pixels_path, bbox=bounds, fid_as_index=True)
    pixels["date"] = decode_dates(pixels["sufosat_date"].to_numpy())
    pixels = pixels[pixels["date"] >= min_date]
    return pixels, pixels.geometry.bounds["miny"].to_numpy()


def find_pairs(
    pixels_path: Path,
    bands: list[tuple[float, float]],
    total_bounds: Bounds,
    min_date: pd.Timestamp,
    max_meters_between_clear_cuts: int,
    max_days_between_clear_cuts: int,
) -> tuple[IntArray, IntArray, IntArray, IntArray]:
    """
    Les pixels à au plus `max_meters_between_clear_cuts` et
    `max_days_between_clear_cuts` l'un de l'autre, en numéros d'entité.

    Chaque pixel appartient à la bande où se trouve son bas. Elle est lue avec
    une marge de `max_meters_between_clear_cuts` : ses voisins des bandes
    adjacentes en font partie, et aucune paire ne se perd entre deux bandes.

    Retourne les pixels, la bande de chacun, puis les deux colonnes de paires.
    """
    minx, _, maxx, _ = total_bounds
    margin = max_meters_between_clear_cuts
    nodes, node_bands, lefts, rights = [], [], [], []
    for band, (y0, y1) in enumerate(bands):
        pixels, bottoms = read_pixels(
            pixels_path, (minx, y0 - margin, maxx, y1 + margin), min_date
        )
        home = (bottoms >= y0) & (bottoms < y1)
        fids = pixels.index.to_numpy(dtype=np.int64)
        dates = pixels["date"].to_numpy()
        home_positions = np.flatnonzero(home)
        nodes.append(fids[home_positions])
        node_bands.append(np.full(len(home_positions), band, dtype=np.int64))

        left, right = pixels.sindex.query(
            pixels.geometry.iloc[home_positions],
            predicate="dwithin",
            distance=max_meters_between_clear_cuts,
        )
        left = home_positions[left]
        close_in_time = (
            np.abs(
                (dates[left] - dates[right]).astype("timedelta64[D]").astype(np.int64)
            )
            <= max_days_between_clear_cuts
        )
        keep = close_in_time & (left != right)
        lefts.append(fids[left[keep]])
        rights.append(fids[right[keep]])

    return (
        np.concatenate(nodes),
        np.concatenate(node_bands),
        np.concatenate(lefts),
        np.concatenate(rights),
    )


def connected_components(node_count: int, left: IntArray, right: IntArray) -> IntArray:
    """
    Numéro de groupe de chaque nœud (0 à `node_count` - 1), deux nœuds reliés
    par une paire (`left`, `right`) étant dans le même groupe.

    Accroche chaque racine à la plus petite de ses voisines, puis raccourcit
    les chemins, jusqu'à ce que chaque paire partage sa racine. Tout se passe
    dans des tableaux d'entiers : 15 millions de pixels tiennent en 120 Mo.
    """
    parent = np.arange(node_count, dtype=np.int64)
    while True:
        root_left, root_right = parent[left], parent[right]
        differ = root_left != root_right
        if not differ.any():
            break
        lowest = np.minimum(root_left[differ], root_right[differ])
        np.minimum.at(parent, root_left[differ], lowest)
        np.minimum.at(parent, root_right[differ], lowest)
        while True:
            grandparent = parent[parent]
            if np.array_equal(grandparent, parent):
                break
            parent = grandparent
    _, groups = np.unique(parent, return_inverse=True)
    return groups


def add_concave_hull_score(
    gdf: gpd.GeoDataFrame, concave_hull_ratio: float
) -> gpd.GeoDataFrame:
    """
    Help identify the clear-cuts with complex shapes that may represent false positives.

    This function uses the concave hull score (ratio of the area of the shape to the
    area of its concave hull) to identify shapes that are too complex.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons.
    concave_hull_ratio : float
        Ratio parameter for the concave hull calculation (1.0 = convex hull).
        Lower values create tighter hulls that follow the shape more closely.

    Returns
    -------
    gpd.GeoDataFrame
        GeoDataFrame with complex shapes tagged.

    Notes
    -----
    The concave hull score (area of polygon / area of concave hull) provides a measure
    of shape complexity. Values close to 0 indicate more complex, irregular shapes,
    while large values indicate simpler shapes. We clip the max score to 1.
    """
    # concave_hull(ratio=1) would be the same as convex_hull
    gdf["concave_hull_score"] = gdf.area / gdf.concave_hull(concave_hull_ratio).area

    # The score can be greater than 1 but we can clip it to [0, 1] for simplicity
    gdf["concave_hull_score"] = gdf["concave_hull_score"].clip(upper=1)

    return gdf


def finish_clusters(
    parts: gpd.GeoDataFrame, concave_hull_ratio: float
) -> gpd.GeoDataFrame:
    """Attributs des clusters une fois leur géométrie complète."""
    parts["days_delta"] = (parts["date_max"] - parts["date_min"]).dt.days
    # Fill tiny gaps left after the dissolve/union operation
    parts["geometry"] = parts.geometry.buffer(0.0001)
    parts = add_concave_hull_score(parts, concave_hull_ratio)
    # 1 hectare = 10,000 m²
    parts["area_ha"] = parts.area / 10000
    return parts[
        [
            "date_min",
            "date_max",
            "days_delta",
            "clear_cut_group_size",
            "concave_hull_score",
            "area_ha",
            "geometry",
        ]
    ]


def append_clusters(clusters: gpd.GeoDataFrame, output_path: Path) -> None:
    if clusters.empty:
        return
    clusters.to_file(
        output_path,
        driver="GPKG",
        index=True,
        mode="a" if output_path.exists() else "w",
        # La couche prend le type de la première bande écrite : sans
        # promotion, une bande de Polygon la fige en POLYGON et les
        # MultiPolygon des bandes suivantes font échouer la conversion en
        # FlatGeobuf.
        promote_to_multi=True,
    )


def cluster_pixels(
    pixels_path: Path,
    output_path: Path,
    min_date: pd.Timestamp,
    max_meters_between_clear_cuts: int,
    max_days_between_clear_cuts: int,
    concave_hull_ratio: float,
) -> int:
    """
    Regroupe les polygones de pixels datés de `min_date` ou après en clusters,
    écrits dans le GeoPackage `output_path`, et retourne leur nombre.

    Deux pixels sont dans le même cluster s'ils sont reliés par une suite de
    pixels distants deux à deux d'au plus `max_meters_between_clear_cuts` et
    `max_days_between_clear_cuts`. Le travail se fait par bandes : les paires
    d'abord, puis les groupes sur les seuls numéros d'entité, puis l'union des
    géométries de chaque groupe, bande par bande. Les groupes à cheval sur
    plusieurs bandes sont réunis à la fin.
    """
    info = pyogrio.read_info(pixels_path, force_total_bounds=True)
    if info["features"] == 0:
        return 0
    total_bounds = cast(Bounds, tuple(info["total_bounds"]))
    bands = horizontal_bands(total_bounds)
    logging.info(
        f"Pairing pixels dated {min_date.date()} or later in {len(bands)} bands"
    )
    nodes, node_bands, left, right = find_pairs(
        pixels_path,
        bands,
        total_bounds,
        min_date,
        max_meters_between_clear_cuts,
        max_days_between_clear_cuts,
    )
    logging.info(f"Found {len(left)} pairs between {len(nodes)} pixels")

    order = np.argsort(nodes)
    nodes, node_bands = nodes[order], node_bands[order]
    groups = connected_components(
        len(nodes), np.searchsorted(nodes, left), np.searchsorted(nodes, right)
    )
    group_count = int(groups.max()) + 1 if len(groups) else 0
    band_count = np.zeros(group_count, dtype=np.int64)
    np.add.at(band_count, np.unique(groups * len(bands) + node_bands) // len(bands), 1)
    straddling = np.flatnonzero(band_count > 1)
    logging.info(
        f"Created {group_count} clusters, {len(straddling)} of them across bands"
    )

    if output_path.exists():
        output_path.unlink()
    minx, _, maxx, _ = total_bounds
    pending = []
    for band, (y0, y1) in enumerate(bands):
        pixels, bottoms = read_pixels(pixels_path, (minx, y0, maxx, y1), min_date)
        pixels = pixels[(bottoms >= y0) & (bottoms < y1)]
        if pixels.empty:
            continue
        pixels["clear_cut_group"] = groups[
            np.searchsorted(nodes, pixels.index.to_numpy())
        ]
        parts = pixels.dissolve(
            by="clear_cut_group", aggfunc={"date": ["min", "max"]}
        ).rename(columns={("date", "min"): "date_min", ("date", "max"): "date_max"})
        parts["clear_cut_group_size"] = pixels.groupby("clear_cut_group").size()
        across = parts.index.isin(straddling)
        pending.append(parts[across])
        append_clusters(
            finish_clusters(parts[~across], concave_hull_ratio), output_path
        )
        logging.info(f"Band {band + 1}/{len(bands)}: {len(pixels)} pixels")

    if pending:
        parts = pd.concat(pending).reset_index()
        merged = parts.dissolve(
            by="clear_cut_group",
            aggfunc={
                "date_min": "min",
                "date_max": "max",
                "clear_cut_group_size": "sum",
            },
        )
        append_clusters(finish_clusters(merged, concave_hull_ratio), output_path)

    return group_count


@log_execution([RESULT_FILEPATH])
def preprocess_sufosat(
    input_raster_dates: str = str(
        SUFOSAT_DIR / "forest-clearcuts_mainland-france_sufosat_dates_v3.tif"
    ),
    polygonized_raster_output_layer: str = str(
        SUFOSAT_DIR / "forest-clearcuts_mainland-france_sufosat_dates_v3.fgb"
    ),
    masked_raster_dates: str = str(SUFOSAT_DIR / "radd_date_alert_gte_2.tif"),
    max_meters_between_clear_cuts: int = 100,
    max_days_between_clear_cuts: int = 365,
    concave_hull_ratio: float = 0.42,
    update_start_date: str | None = None,
) -> None:
    """
    Process forest clear-cut raster data into a vector layer of clear-cut clusters.

    1. Converts raster clear-cut data to vector polygons
    2. Clusters nearby clear-cuts in space and time, band by band
    3. Merges clear-cuts within each cluster, with shape complexity and area
    4. Saves the clusters to RESULT_FILEPATH

    Parameters
    ----------
    input_raster_dates : str
        Path to the input raster file containing clear-cut dates in SUFOSAT format
        (YYDDD): either the single Date band exported from Earth Engine, or a raw
        two-band RADD raster (Alert, Date).
    polygonized_raster_output_layer : str
        Path for the temporary vector file created during polygonization.
    masked_raster_dates : str
        Path for the temporary single-band raster of the dates kept.
    max_meters_between_clear_cuts : int
        Maximum distance in meters between clear-cuts to consider them spatially related.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them temporally related.
    concave_hull_ratio : float
        Ratio parameter for the concave hull calculation (1.0 = convex hull).
        Lower values create tighter hulls that follow the shape more closely.
    update_start_date : str | None
        Lower bound (inclusive) on the clear-cut date; None on a first run.
        Never earlier than MIN_CLEARCUT_DATE.
    """
    min_date = MIN_CLEARCUT_DATE
    if update_start_date:
        min_date = max(pd.Timestamp(update_start_date), MIN_CLEARCUT_DATE)

    logging.info(f"Keeping the alerts dated {min_date.date()} or later")
    mask_alerts(input_raster_dates, masked_raster_dates, min_date)

    logging.info(f"Polygonize {masked_raster_dates}")
    polygonize_raster(
        input_raster=masked_raster_dates,
        output_layer_file=polygonized_raster_output_layer,
        fieldname="sufosat_date",
    )

    clusters_gpkg = RESULT_FILEPATH.with_suffix(".gpkg")
    cluster_count = cluster_pixels(
        Path(polygonized_raster_output_layer),
        clusters_gpkg,
        min_date,
        max_meters_between_clear_cuts,
        max_days_between_clear_cuts,
        concave_hull_ratio,
    )
    if RESULT_FILEPATH.exists():
        RESULT_FILEPATH.unlink()
    if cluster_count == 0:
        logging.info("No clear-cut pixel since %s", min_date.date())
        return
    to_flatgeobuf(str(clusters_gpkg), str(RESULT_FILEPATH))
    clusters_gpkg.unlink()
