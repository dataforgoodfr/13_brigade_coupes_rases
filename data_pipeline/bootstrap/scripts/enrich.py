import dask_geopandas
from dask.diagnostics import ProgressBar

from scripts import DATA_DIR
from scripts.utils import log_execution
from scripts.utils.df_utils import load_gdf, save_gdf
from script.modules.cities import enrich_with_cities
from script.modules.natura2000 import enrich_with_natura2000_area, enrich_with_natura2000_codes
from script.modules.natura2000 import enrich_with_slope_information

ENRICHED_CLUSTERS_RESULT_FILEPATH = DATA_DIR / "sufosat/sufosat_clusters_enriched.fgb"


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
