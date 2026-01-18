import os
import logging
from datetime import timedelta
from pipeline.scripts import DATA_DIR
from pipeline.scripts.get_sufosat_tiff import get_sufosat_tiff
from pipeline.scripts.get_reference_data import get_enrichment_data
from pipeline.scripts.preprocess_sufosat import preprocess_sufosat
from pipeline.scripts.get_last_version import get_last_version
from pipeline.scripts.get_new_and_update import split_new_and_updated_clusters, upadte_geometries
#from pipeline.scripts.enrich_sufosat_clusters import enrich_sufosat_clusters

# TODO : ajouter une méthode de récupération des fichiers de configuration pour les paramètres de la pipeline
def run_pipeline() -> None:
    logging.info("Starting the pipeline...")
    
    # Récupération de la dernière date de la version gold
    last_version_date = get_last_version()
    next_date = last_version_date + timedelta(days=1)
    last_version_date_str = next_date.strftime('%Y-%m-%d')
    logging.info(f"Last version date: {last_version_date_str}")

    # STEP 1 : Extract
    has_new_data = get_sufosat_tiff()
    if has_new_data:
        get_enrichment_data()

        # STEP 2 : Transform
        for f in os.listdir(str(DATA_DIR / "sufosat")):
            if f.endswith(".tif"):
                sufosat_data = f  
        
        preprocess_sufosat(
            input_raster_dates= str(DATA_DIR / "sufosat" / sufosat_data), 
            polygonized_raster_output_layer= str(DATA_DIR / "sufosat" / sufosat_data.replace(".tif", ".fgb")),
            update_start_date= last_version_date_str 
        )

        gdf_updated, gdf_new = split_new_and_updated_clusters(
            str(DATA_DIR / "sufosat_reference" / "filtered_clusters_enriched.fgb"), 
            str(DATA_DIR / "sufosat" / "sufosat_clusters.fgb"), 
            distance_threshold=50
        )

        # upadte_geometries()

    else: 
        logging.info("Stopping pipeline: No new Sufosat data.")


    #enrich_sufosat_clusters()  # enrich sufosat DATA

    # Step 3 : Load

    logging.info("The pipeline has run successfully.")





if __name__ == "__main__":
    run_pipeline()