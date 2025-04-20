from scripts import DATA_DIR
from scripts.utils import log_execution, save_gdf
from script.utils.convert_crs import convert_crs_to_lambert93
from script.modules.cities import download_etalab_cities_cadastre, remove_overseas_cities
from script.modules.departments import download_osm_departments_cadastre, remove_overseas_departments
from script.modules.natura2000 import download_layers, load_layers, concat_layers, union_explode_layers
from script.modules.slope import get_dem_assembly_map, download_dem_tiles,  decompress_dem_tiles, downloaded_tiles_sanity_check, compute_slope_from_elevation, binarize_slope_gte_30, merge_raster_tiles, polygonize_slope_raster
from script.modules.sufosat import download_sufosat_raster_dates, polygonize_sufosat, parse_sufosat_date, cluster_clear_cuts, union_clear_cut_clusters, add_concave_hull_score, add_area_ha

CADASTRE_CITIES_DIR = DATA_DIR / "cadastre_cities"
RESULT_FILEPATH = CADASTRE_CITIES_DIR / "cadastre_cities.fgb"
NATURA_2000_DIR = DATA_DIR / "natura2000"
CONCAT_RESULT_FILEPATH = NATURA_2000_DIR / "natura2000_concat.fgb"
UNION_RESULT_FILEPATH = NATURA_2000_DIR / "natura2000_union.fgb"
SLOPE_DIR = DATA_DIR / "slope"
RESULT_FILEPATH = SLOPE_DIR / "slope_gte_30.fgb"
SUFOSAT_DIR = DATA_DIR / "sufosat"
DETECTIONS_RESULT_FILEPATH = SUFOSAT_DIR / "sufosat_detections.fgb"
CLUSTERS_RESULT_FILEPATH = SUFOSAT_DIR / "sufosat_clusters.fgb"


@log_execution(RESULT_FILEPATH)
def preprocess_cadastre_cities() -> None:
    cities = download_etalab_cities_cadastre()
    cities = remove_overseas_cities(cities)
    cities = convert_crs_to_lambert93(cities)
    cities = cities[["id", "nom", "geometry"]].rename(
        columns={"id": "code_insee", "nom": "name"}
    )
    save_gdf(cities, RESULT_FILEPATH)

@log_execution(RESULT_FILEPATH)
def preprocess_cadastre_departments() -> None:
    departments = download_osm_departments_cadastre()
    departments = remove_overseas_departments(departments)
    departments = convert_crs_to_lambert93(departments)
    departments = departments[["code_insee", "nom", "geometry"]].rename(columns={"nom": "name"})
    save_gdf(departments, RESULT_FILEPATH)

@log_execution([CONCAT_RESULT_FILEPATH, UNION_RESULT_FILEPATH])
def preprocess_natura2000() -> None:
    download_layers()
    zps, sic = load_layers()
    natura2000_concat = concat_layers(zps, sic)
    save_gdf(natura2000_concat, CONCAT_RESULT_FILEPATH)
    natura2000_union = union_explode_layers(natura2000_concat)
    save_gdf(natura2000_union, UNION_RESULT_FILEPATH)

@log_execution(RESULT_FILEPATH)
def preprocess_slope() -> None:
    assembly_map = get_dem_assembly_map()
    download_dem_tiles()
    decompress_dem_tiles()
    downloaded_tiles_sanity_check(assembly_map)
    compute_slope_from_elevation()
    binarize_slope_gte_30()
    merge_raster_tiles()
    polygonize_slope_raster()

@log_execution([DETECTIONS_RESULT_FILEPATH, CLUSTERS_RESULT_FILEPATH])
def preprocess_sufosat(
    input_raster_dates: str = str(
        SUFOSAT_DIR / "forest-clearcuts_mainland-france_sufosat_dates_v3.tif"
    ),
    polygonized_raster_output_layer: str = str(
        SUFOSAT_DIR / "forest-clearcuts_mainland-france_sufosat_dates_v3.fgb"
    ),
    max_meters_between_clear_cuts: int = 100,
    max_days_between_clear_cuts: int = 365,
    concave_hull_ratio: float = 0.42,
) -> None:
    """
    Process forest clear-cut raster data into a vector layer of clear-cut clusters.

    This function orchestrates a complete workflow for processing forest clear-cut data:
    1. Converts raster clear-cut data to vector polygons
    2. Processes the dates associated with each clear-cut
    3. Clusters nearby clear-cuts in space and time, and saves the result
    4. Merges clear-cuts within each cluster
    5. Add shape complexity and area attributes
    6. Saves the final vector dataset

    Parameters
    ----------
    input_raster_dates : str
        Path to the input raster file containing clear-cut dates in SUFOSAT format.
    polygonized_raster_output_layer : str
        Path for the temporary vector file created during polygonization.
    max_meters_between_clear_cuts : int
        Maximum distance in meters between clear-cuts to consider them spatially related.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them temporally related.
    concave_hull_ratio : float
        Ratio parameter for the concave hull calculation (1.0 = convex hull).
        Lower values create tighter hulls that follow the shape more closely.

    Returns
    -------
    None
        The function saves the results to the specified output_layer path.
    """
    download_sufosat_raster_dates(input_raster_dates)
    gdf = polygonize_sufosat(input_raster_dates, polygonized_raster_output_layer)
    gdf = parse_sufosat_date(gdf)
    gdf = cluster_clear_cuts(gdf, max_meters_between_clear_cuts, max_days_between_clear_cuts)
    save_gdf(gdf, DETECTIONS_RESULT_FILEPATH)
    gdf = union_clear_cut_clusters(gdf)
    gdf = add_concave_hull_score(gdf, concave_hull_ratio)
    gdf = add_area_ha(gdf)
    save_gdf(gdf, CLUSTERS_RESULT_FILEPATH, index=True)
    
if __name__ == "__main__":
    preprocess_cadastre_cities()
    preprocess_cadastre_departments()
    preprocess_natura2000()
    preprocess_slope()
    preprocess_sufosat()
