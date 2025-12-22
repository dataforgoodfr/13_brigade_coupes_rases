import os
import logging
from pipeline.scripts import DATA_DIR
from pipeline.scripts.get_sufosat_tiff import get_sufosat_tiff
from pipeline.scripts.get_reference_data import get_enrichment_data
from pipeline.scripts.preprocess_sufosat import preprocess_sufosat
#from pipeline.scripts.enrich_sufosat_clusters import enrich_sufosat_clusters

# TODO : ajouter une méthode de récupération des fichiers de configuration pour les paramètres de la pipeline
def run_pipeline() -> None:
    logging.info("Starting the pipeline...")

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
            update_start_date= "2024-09-01" #TODO: passer cette date dans les fichiers de configurations
        )
    else: 
        logging.info("Stopping pipeline: No new Sufosat data.")


    #enrich_sufosat_clusters()  # enrich sufosat DATA

    # Step 3 : Load

    logging.info("The pipeline has run successfully.")





if __name__ == "__main__":
    run_pipeline()
