import os
import shutil
import logging
import geopandas as gpd
from datetime import timedelta
from pipeline.scripts import DATA_DIR
from pipeline.scripts.get_last_version import get_last_version
from pipeline.scripts.get_sufosat_tiff import get_sufosat_tiff
from pipeline.scripts.get_reference_data import get_enrichment_data
from pipeline.scripts.preprocess_sufosat import preprocess_sufosat
from pipeline.scripts.enrich_sufosat_clusters import enrich_sufosat_clusters
from pipeline.scripts.get_new_and_update import split_new_and_updated_clusters, update_geometries
from pipeline.scripts.upload_gold import upload_gold_to_s3
from pipeline.scripts.db_export import export_database


def run_pipeline() -> None:
    logging.info("Starting the pipeline...")

    last_version_date = get_last_version()

    if last_version_date is None:
        update_start_date = None
    else:
        update_start_date = (last_version_date + timedelta(days=1)).strftime('%Y-%m-%d')

    logging.info(f"Last version date: {last_version_date}, update_start_date: {update_start_date}")

    get_sufosat_tiff()

    get_enrichment_data()

    sufosat_tif_filename = next(
        f for f in os.listdir(str(DATA_DIR / "sufosat")) if f.endswith(".tif")
    )

    preprocess_sufosat(
        input_raster_dates=str(DATA_DIR / "sufosat" / sufosat_tif_filename),
        polygonized_raster_output_layer=str(DATA_DIR / "sufosat" / "sufosat_clusters.fgb"),
        update_start_date=update_start_date,
    )

    clusters_path = DATA_DIR / "sufosat" / "sufosat_clusters.fgb"
    if not clusters_path.exists() or len(gpd.read_file(str(clusters_path))) == 0:
        logging.info("No new clusters after preprocessing, pipeline is up to date.")
        return

    enrich_sufosat_clusters()

    if last_version_date is None:
        # Premier run : pas de données en base, le fichier enrichi devient directement le gold final
        shutil.copy(
            str(DATA_DIR / "sufosat" / "sufosat_clusters_enriched.fgb"),
            str(DATA_DIR / "sufosat" / "clusters_final.fgb"),
        )
    else:
        db_reference_path = str(DATA_DIR / "sufosat_reference" / "sufosat_clusters_enriched.fgb")
        export_database(
            database_url=os.getenv("DATABASE_URL"),
            output_file=db_reference_path,
        )

        split_new_and_updated_clusters(
            gdf_new=str(DATA_DIR / "sufosat" / "sufosat_clusters_enriched.fgb"),
            gdf_ref=db_reference_path,
        )
        update_geometries()

    upload_gold_to_s3()

    logging.info("Pipeline completed successfully.")


if __name__ == "__main__":
    run_pipeline()
