import logging

import dask_geopandas
import geopandas as gpd
from dask.diagnostics import ProgressBar

from scripts import DATA_DIR
from scripts.utils import display_df, log_execution
from scripts.utils.df_utils import load_gdf, save_gdf

ENRICHED_CLUSTERS_RESULT_FILEPATH = DATA_DIR / "sufosat/sufosat_clusters_enriched.fgb"


def overlay(
    left_gdf: dask_geopandas.GeoDataFrame, right_gdf: gpd.GeoDataFrame
) -> dask_geopandas.GeoDataFrame:
    """
    Perform overlay operation between dask_geopandas and regular geopandas DataFrames.

    This custom implementation is needed since dask-geopandas doesn't provide an 'overlay' function.

    Parameters
    ----------
    left_gdf : dask_geopandas.GeoDataFrame
        Left GeoDataFrame in dask format
    right_gdf : gpd.GeoDataFrame
        Right GeoDataFrame

    Returns
    -------
    dask_geopandas.GeoDataFrame
        Result of the overlay operation
    """
    # Assign right geometry to a separate column
    right_gdf = right_gdf.assign(right_geometry=right_gdf.geometry)

    # Spatial join the GeoDataFrames (using left and right geometries)
    # dask-geopandas only supports "inner" joins
    joined_gdf = left_gdf.sjoin(right_gdf, how="inner", predicate="intersects")

    # Calculate intersection of geometries
    joined_gdf["geometry"] = joined_gdf.geometry.intersection(joined_gdf.right_geometry)

    # Drop temporary right_geometry column
    joined_gdf = joined_gdf.set_geometry(col="geometry").drop(columns="right_geometry")

    return joined_gdf


def enrich_with_cities(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with the list of intersecting city INSEE codes")

    # Load cities data
    logging.info("Loading cities data")
    cadastre_cities = load_gdf(DATA_DIR / "cadastre_cities/cadastre_cities.fgb")

    # Find cities that intersect with clear-cut clusters
    cities = (
        overlay(sufosat_dask, cadastre_cities)
        .groupby("clear_cut_group")["code_insee"]
        .agg(list)
        .compute()
    )

    # Add cities to the SUFOSAT DataFrame
    sufosat.loc[cities.index, "cities"] = cities
    missing_cities_count = sufosat["cities"].isna().sum()
    logging.info(f"{missing_cities_count} clear-cut clusters don't intersect with any city")

    # Handle clear-cuts that don't fall within any city polygon
    # by joining with their nearest cities
    if missing_cities_count > 0:
        logging.info("Finding nearest cities for clusters without city intersection")
        clear_cuts_with_nearest_cities = (
            sufosat[sufosat["cities"].isna()]
            .sjoin_nearest(cadastre_cities)
            .groupby("clear_cut_group")["code_insee"]
            .agg(list)
        )

        sufosat.loc[clear_cuts_with_nearest_cities.index, "cities"] = (
            clear_cuts_with_nearest_cities
        )
        logging.info(
            f"{sufosat['cities'].isna().sum()} clusters remain without city information"
        )

    display_df(sufosat)

    return sufosat


def enrich_with_natura2000_area(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with Natura 2000 area information")

    # Load Natura 2000 data
    # It is important to use the unioned Natura2000 geodataframe to avoid counting the same area multiple times
    natura2000_union = load_gdf(DATA_DIR / "natura2000/natura2000_union.fgb")

    # Calculate intersection area in hectares (1 hectare = 10,000 m²)
    natura2000_area_ha = overlay(sufosat_dask, natura2000_union).area.compute() / 10000

    # Add Natura 2000 area to the SUFOSAT DataFrame
    sufosat.loc[natura2000_area_ha.index, "natura2000_area_ha"] = natura2000_area_ha

    # Fill NA values with 0 (no intersection with Natura 2000)
    sufosat["natura2000_area_ha"] = sufosat["natura2000_area_ha"].fillna(0)

    logging.info(f"{len(natura2000_area_ha)} clusters intersect with Natura 2000 areas")

    display_df(sufosat)

    return sufosat


def enrich_with_natura2000_codes(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with Natura 2000 codes information")

    # Load Natura 2000 data
    # It is important to use the unioned Natura2000 geodataframe to avoid counting the same area multiple times
    natura2000_concat = load_gdf(DATA_DIR / "natura2000/natura2000_concat.fgb")

    # Find the Natura2000 codes that intersect with the clear-cuts
    natura2000_codes = overlay(sufosat_dask, natura2000_concat)
    natura2000_codes = (
        natura2000_codes.groupby(natura2000_codes.index)["code"].agg(list).compute()
    )

    # Add Natura 2000 area to the SUFOSAT DataFrame
    sufosat.loc[natura2000_codes.index, "natura2000_codes"] = natura2000_codes

    display_df(sufosat)

    return sufosat


def enrich_with_slope_information(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with slope information")

    # Load slope data
    slope = load_gdf(DATA_DIR / "slope/slope_gte_30.fgb")

    # Get the geometry of the intersection between SUFOSAT and the slopes
    slope_intersection = overlay(sufosat_dask, slope)

    # Explode multi-polygons into simple polygons for accurate area calculation,
    # as we want the area of the single largest polygon for this metric
    slope_intersection = slope_intersection.explode()

    # Compute the simple polygons intersection area in hectares (1 hectare = 10,000 m²)
    slope_area_ha = slope_intersection.area.compute() / 10000

    # For each clear-cut cluster, keep the largest slope intersection area
    slope_area_ha = slope_area_ha.sort_values(ascending=True)
    slope_area_ha = slope_area_ha[~slope_area_ha.index.duplicated(keep="last")]

    # Add slope area to the SUFOSAT DataFrame
    sufosat.loc[slope_area_ha.index, "slope_area_ha"] = slope_area_ha

    # Fill NA values with 0 (no intersection with slopes ≥ 30%)
    sufosat["slope_area_ha"] = sufosat["slope_area_ha"].fillna(0)

    logging.info(f"{len(slope_area_ha)} clusters intersect with steep slopes")

    display_df(sufosat)

    return sufosat


@log_execution(ENRICHED_CLUSTERS_RESULT_FILEPATH)
def enrich_sufosat_clusters() -> None:
    """
    Enrich SUFOSAT clear-cut clusters with additional geographical information.

    This function enriches the clusters with:
    - City information (which cities the cluster belongs to)
    - Natura 2000 area information (intersection area in hectares)
    - Slope information (largest area with slopes ≥ 30% in hectares)
    """
    # Register progress bar for dask operations
    ProgressBar().register()

    # Load SUFOSAT clusters
    sufosat = load_gdf(DATA_DIR / "sufosat/sufosat_clusters.fgb").set_index("clear_cut_group")

    # Convert to dask_geopandas for parallel processing
    # TODO: What's the ideal number of partitions???
    sufosat_dask = dask_geopandas.from_geopandas(sufosat, npartitions=12)

    sufosat = enrich_with_cities(sufosat, sufosat_dask)
    sufosat = enrich_with_natura2000_area(sufosat, sufosat_dask)
    sufosat = enrich_with_natura2000_codes(sufosat, sufosat_dask)
    sufosat = enrich_with_slope_information(sufosat, sufosat_dask)

    # Save the enriched SUFOSAT clusters
    sufosat = sufosat.sort_values("area_ha")
    save_gdf(sufosat, ENRICHED_CLUSTERS_RESULT_FILEPATH, index=True)


if __name__ == "__main__":
    enrich_sufosat_clusters()
