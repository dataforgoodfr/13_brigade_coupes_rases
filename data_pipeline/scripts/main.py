from extract import extract_tif_data
from transform import (
    cluster_clear_cuts_by_time_and_space,
    filter_and_polygonize,
    update_clusters,
)
from utils.logging_etl import etl_logger

logger = etl_logger("logs/main.log")


def run_pipeline():
    try:
        logger.info("🚀 Starting the pipeline...")

        # STEP 1: EXTRACT SUFOSAT TIFF DATA
        extract_tif_data()

        # STEP 2: POLYGONIZE RASTER DATA
        filter_and_polygonize()

        # STEP 3: CLUTER CLEAR CUTS
        cluster_clear_cuts_by_time_and_space()

        # STEP 4: APPLY UPDATE RULES BASED ON PREVIOUS DATA
        update_clusters()

        # State success log
        logger.info("✅ ETL pipeline completed successfully")
    except Exception as e:
        logger.error(f"❌ Error in the ETL pipeline: {str(e)}")


if __name__ == "__main__":
    run_pipeline()
