import logging
from collections.abc import Iterator
from pathlib import Path
from typing import cast

import geopandas as gpd
import pandas as pd
import pyogrio
from shapely.geometry import box

from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import display_df, log_execution, save_gdf

ENRICHED_CLUSTERS_RESULT_FILEPATH = DATA_DIR / "sufosat/sufosat_clusters_enriched.fgb"
# Les couches de référence (cadastre, Natura 2000, BD Forêt, pente) sont en
# Lambert 93 alors que le raster RADD est exporté en EPSG:3035 : un sjoin
# geopandas entre deux CRS différents ne renvoie silencieusement rien, d'où la
# reprojection des clusters.
REFERENCE_CRS = "EPSG:2154"

CITIES_PATH = DATA_DIR / "cadastre_cities/cadastre_cities.fgb"
# Union des sites Natura 2000, pour ne pas compter deux fois une surface
# couverte par deux sites qui se chevauchent
NATURA2000_UNION_PATH = DATA_DIR / "natura2000/natura2000_union.fgb"
NATURA2000_CONCAT_PATH = DATA_DIR / "natura2000/natura2000_concat.fgb"
BDFORET_PATH = DATA_DIR / "bdforet/bdforet.fgb"
SLOPE_PATH = DATA_DIR / "slope/slope_gte_30.fgb"

# La France entière ne tient pas en mémoire avec ses couches de référence
# (BD Forêt seule : 7 Go sur disque). Les clusters sont enrichis par carrés de
# ZONE_SIZE_METERS de côté, en ne lisant des couches que l'emprise de la zone.
ZONE_SIZE_METERS = 50_000
# Rayon de recherche initial de la commune la plus proche, doublé tant
# qu'aucune n'est trouvée
NEAREST_CITY_SEARCH_METERS = 5_000
NEAREST_CITY_MAX_SEARCH_METERS = 1_000_000

# Filtres métier : seuls les clusters qui peuvent intéresser la brigade sont
# publiés. Le backend réévalue ensuite ses propres règles (surface, pente,
# zonage écologique, seuils modifiables par les administrateurs) : ces bornes
# restent donc en deçà des siennes.
MIN_AREA_HA = 2.0
# Sous cette surface, seule une coupe en zone Natura 2000 ou en pente est gardée.
ALERT_AREA_HA = 10.0
BDF_AREA_COLUMNS = [
    "bdf_deciduous_area_ha",
    "bdf_mixed_area_ha",
    "bdf_poplar_area_ha",
    "bdf_resinous_area_ha",
]

Bounds = tuple[float, float, float, float]


def to_reference_crs(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    if gdf.crs is None:
        raise ValueError("Clusters have no CRS, cannot align with the reference layers")
    if gdf.crs.to_epsg() == 2154:
        return gdf
    logging.info(f"Reprojecting clusters from {gdf.crs} to {REFERENCE_CRS}")
    return gdf.to_crs(REFERENCE_CRS)


def zone_grid(bounds: Bounds) -> Iterator[Bounds]:
    """Carrés de ZONE_SIZE_METERS couvrant `bounds`."""
    minx, miny, maxx, maxy = bounds
    x0 = minx - minx % ZONE_SIZE_METERS
    y0 = miny - miny % ZONE_SIZE_METERS
    y = y0
    while y <= maxy:
        x = x0
        while x <= maxx:
            yield (x, y, x + ZONE_SIZE_METERS, y + ZONE_SIZE_METERS)
            x += ZONE_SIZE_METERS
        y += ZONE_SIZE_METERS


def read_zone_clusters(path: Path, zone: Bounds) -> gpd.GeoDataFrame:
    """Les clusters d'au moins MIN_AREA_HA dont un point intérieur tombe dans
    `zone` : chacun n'appartient qu'à une zone, même s'il en déborde.

    Les plus petits sont écartés dès la lecture : les filtres métier les
    retireraient de toute façon.
    """
    clusters = gpd.read_file(path, bbox=zone, where=f"area_ha >= {MIN_AREA_HA}")
    if clusters.empty:
        return clusters.set_index("clear_cut_group")
    points = clusters.geometry.representative_point()
    minx, miny, maxx, maxy = zone
    inside = (
        (points.x >= minx) & (points.x < maxx) & (points.y >= miny) & (points.y < maxy)
    )
    return clusters[inside].set_index("clear_cut_group")


def read_reference(path: Path, bounds: Bounds) -> gpd.GeoDataFrame:
    """Les entités d'une couche qui touchent `bounds`, découpées à `bounds`.

    Le découpage ne change aucune intersection avec les clusters de la zone,
    tous contenus dans `bounds`, mais évite de recalculer pour chacun
    l'intersection avec un massif forestier ou un site entier.
    """
    reference = gpd.read_file(path, bbox=bounds)
    if reference.empty:
        return reference
    return gpd.clip(reference, box(*bounds))


def overlay(
    left_gdf: gpd.GeoDataFrame, right_gdf: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    """Intersection des clusters avec une couche, une ligne par paire qui se
    touche, avec les attributs de la couche ; l'index reste celui des clusters."""
    right_gdf = right_gdf.assign(right_geometry=right_gdf.geometry)
    joined_gdf = left_gdf.sjoin(right_gdf, how="inner", predicate="intersects")
    # L'index des clusters se répète d'une paire à l'autre : pas d'alignement
    joined_gdf["geometry"] = joined_gdf.geometry.intersection(
        joined_gdf["right_geometry"], align=False
    )
    return joined_gdf.set_geometry("geometry").drop(columns="right_geometry")


def cities_of(zone: gpd.GeoDataFrame, bounds: Bounds) -> pd.Series:
    """Codes INSEE des communes touchées par chaque cluster ; à défaut, ceux
    de la commune la plus proche."""
    cities = read_reference(CITIES_PATH, bounds)
    touched = overlay(zone, cities).groupby(level=0)["code_insee"].agg(list)

    orphans = zone.loc[~zone.index.isin(touched.index)]
    search = NEAREST_CITY_SEARCH_METERS
    while not orphans.empty and search <= NEAREST_CITY_MAX_SEARCH_METERS:
        minx, miny, maxx, maxy = orphans.total_bounds
        around = gpd.read_file(
            CITIES_PATH,
            bbox=(minx - search, miny - search, maxx + search, maxy + search),
        )
        if not around.empty:
            nearest = (
                orphans.sjoin_nearest(around).groupby(level=0)["code_insee"].agg(list)
            )
            touched = pd.concat([touched, nearest])
            break
        search *= 2
    return cast(pd.Series, touched)


def natura2000_area_ha_of(zone: gpd.GeoDataFrame, bounds: Bounds) -> pd.Series:
    union = read_reference(NATURA2000_UNION_PATH, bounds)
    return cast(pd.Series, overlay(zone, union).area.groupby(level=0).sum() / 10000)


def natura2000_codes_of(zone: gpd.GeoDataFrame, bounds: Bounds) -> pd.Series:
    sites = read_reference(NATURA2000_CONCAT_PATH, bounds)
    return cast(pd.Series, overlay(zone, sites).groupby(level=0)["code"].agg(list))


def bdforet_areas_of(zone: gpd.GeoDataFrame, bounds: Bounds) -> pd.DataFrame:
    """Surface de chaque type de forêt, une colonne `bdf_<type>_area_ha` par
    type rencontré."""
    forests = read_reference(BDFORET_PATH, bounds)
    pieces = overlay(zone, forests)
    return (
        pd.DataFrame(pieces.assign(area_ha=pieces.area / 10000))
        .rename_axis(zone.index.name)[["bdf_type", "area_ha"]]
        .reset_index()
        .pivot_table(
            index=zone.index.name,
            columns="bdf_type",
            values="area_ha",
            aggfunc="sum",
        )
        .add_suffix("_area_ha")
        .add_prefix("bdf_")
    )


def slope_area_ha_of(zone: gpd.GeoDataFrame, bounds: Bounds) -> pd.Series:
    """Surface du plus grand seul tenant en pente ≥ 30 % de chaque cluster."""
    slopes = read_reference(SLOPE_PATH, bounds)
    pieces = overlay(zone, slopes).explode()
    return cast(pd.Series, (pieces.area / 10000).groupby(level=0).max())


def enrich_zone(zone: gpd.GeoDataFrame) -> pd.DataFrame:
    bounds = cast(Bounds, tuple(zone.total_bounds))
    columns = pd.DataFrame(index=zone.index)
    columns["cities"] = cities_of(zone, bounds)
    columns["natura2000_area_ha"] = natura2000_area_ha_of(zone, bounds)
    columns["natura2000_codes"] = natura2000_codes_of(zone, bounds)
    columns = columns.join(bdforet_areas_of(zone, bounds))
    columns["slope_area_ha"] = slope_area_ha_of(zone, bounds)
    return columns


def enrich_clusters_file(path: Path) -> gpd.GeoDataFrame:
    """Les clusters du fichier qui passent les filtres métier, avec les
    communes, Natura 2000, la BD Forêt et la pente.

    Les clusters de la France entière ne tiennent pas en mémoire avec leurs
    couches de référence : ils sont lus, enrichis et filtrés zone par zone.
    """
    total_bounds = pyogrio.read_info(path, force_total_bounds=True)["total_bounds"]
    zones = list(zone_grid(cast(Bounds, tuple(total_bounds))))
    logging.info(f"Enriching the clusters of {path} in {len(zones)} zones")
    kept = []
    read_count = 0
    for number, zone in enumerate(zones, start=1):
        clusters = read_zone_clusters(path, zone)
        if not clusters.empty:
            read_count += len(clusters)
            clusters = to_reference_crs(clusters)
            enriched = clusters.join(enrich_zone(clusters))
            kept.append(enriched[business_filters_mask(enriched)])
        if number % 50 == 0:
            logging.info(f"{number}/{len(zones)} zones enriched")

    if not kept:
        return gpd.GeoDataFrame(geometry=[], crs=REFERENCE_CRS)
    sufosat = pd.concat(kept)
    logging.info(
        "Business filtering kept %s / %s clusters of %s ha or more",
        len(sufosat),
        read_count,
        MIN_AREA_HA,
    )
    # Seuls les types de forêt rencontrés ont une colonne : compléter, puis
    # remettre la BD Forêt entre Natura 2000 et la pente
    for col in BDF_AREA_COLUMNS:
        if col not in sufosat.columns:
            sufosat[col] = 0.0
    bdf_columns = sorted(c for c in sufosat.columns if c.startswith("bdf_"))
    others = [
        c for c in sufosat.columns if c not in bdf_columns and c != "slope_area_ha"
    ]
    return sufosat[[*others, *bdf_columns, "slope_area_ha"]].sort_values("area_ha")


def business_filters_mask(sufosat: gpd.GeoDataFrame) -> pd.Series:
    """
    Les clusters d'au moins MIN_AREA_HA, situés en forêt selon la BD Forêt, et
    soit d'au moins ALERT_AREA_HA, soit touchant une zone Natura 2000 ou une
    pente.
    """
    # Seuls les types de forêt rencontrés ont une colonne.
    bdf_areas = sufosat.reindex(columns=BDF_AREA_COLUMNS)
    in_forest = bdf_areas.fillna(0).sum(axis=1) > 0

    large_enough = sufosat["area_ha"] >= MIN_AREA_HA
    worth_an_alert = (
        (sufosat["area_ha"] >= ALERT_AREA_HA)
        | (sufosat["natura2000_area_ha"].fillna(0) > 0)
        | (sufosat["slope_area_ha"].fillna(0) > 0)
    )
    return cast(pd.Series, large_enough & worth_an_alert & in_forest)


@log_execution(ENRICHED_CLUSTERS_RESULT_FILEPATH)
def enrich_sufosat_clusters() -> None:
    """
    Enrich SUFOSAT clear-cut clusters with additional geographical information.

    This function enriches the clusters with:
    - City information (which cities the cluster belongs to)
    - Natura 2000 area and codes
    - BD Forêt area of each forest type
    - Slope information (largest area with slopes ≥ 30% in hectares)
    """
    sufosat = enrich_clusters_file(DATA_DIR / "sufosat/sufosat_clusters.fgb")
    display_df(sufosat)

    save_gdf(sufosat, ENRICHED_CLUSTERS_RESULT_FILEPATH, index=True)


if __name__ == "__main__":
    enrich_sufosat_clusters()
