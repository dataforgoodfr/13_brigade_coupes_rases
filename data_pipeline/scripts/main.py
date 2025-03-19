import os
import sys
import yaml
from extract import *
from transform import *
from utils.s3 import S3Manager
from utils.logging import etl_logger


# File configuration
logger = etl_logger() # Logging
s3_manager = S3Manager() # S3
with open("config/config.yaml") as stream: # configs yaml
    configs = yaml.safe_load(stream)


def run_pipeline():
    try:
        logger.info("🚀 Starting the pipeline...")
        # Step 1: Check if file in S3
        logger.info("Check if file in S3 ...")
        file_exists = check_tif_in_s3(
            configs["extract_sufosat"]["s3_prefix"], 
            configs["extract_sufosat"]["s3_filename"]
        )
        
        # Step 2: Check if an update is needed
        logger.info("Checking for updates...")
        update_info = data_update(
            configs["extract_sufosat"]["zendo_filename"], 
            configs["extract_sufosat"]["zendo_id"],
            configs["extract_sufosat"]["s3_prefix"],
            configs["extract_sufosat"]["s3_sufosat_metadata"],
        )
        
        # Update if needed or if not in S3
        if update_info["do_update"] or not file_exists:
            logger.info("Extract data from Zenodo...")
            # Step 3: Extract data and load to S3 
            extract_tif_data_and_upload(
                configs["extract_sufosat"]["zendo_id"],
                configs["extract_sufosat"]["zendo_filename"],
                configs["extract_sufosat"]["s3_prefix"] + configs["extract_sufosat"]["zendo_filename"],
            )
            
            # Step 4: Update metadata
            update_metadata(
                configs["extract_sufosat"]["s3_prefix"], 
                configs["extract_sufosat"]["s3_sufosat_metadata"],
                update_info
            )
        
        # ETL successfully completed without udpates
        # else:
        #     logger.info("✅ No updates needed. Data is up-to-date.")
        
        # Step 5: Load file from S3 to local
        logger.info("Loading S3 file to local...")
        s3_manager.download_from_s3(
            s3_key = configs["extract_sufosat"]["s3_prefix"] + configs["extract_sufosat"]["zendo_filename"], 
            download_path = configs["transform_sufosat"]["download_path"] + configs["extract_sufosat"]["zendo_filename"]
        )

        logger.info("Preparing sufosat layer...")
        prepare_sufosat_v3_layer(
            input_raster_dates = configs["transform_sufosat"]["download_path"] + configs["extract_sufosat"]["zendo_filename"],
            temp_output_vector_dates =  configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["polygonized_data"],
            output_layer = configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["export_filename"],
            max_meters_between_clear_cuts =  configs["transform_sufosat"]["max_meters_between_clear_cuts"],
            max_days_between_clear_cuts = configs["transform_sufosat"]["max_days_between_clear_cuts"],
            min_clear_cut_area_ha =  configs["transform_sufosat"]["min_clear_cut_area_ha"],
            concave_hull_ratio =  configs["transform_sufosat"]["magic_number"],
            concave_hull_threshold =  configs["transform_sufosat"]["magic_number"],
        )


        # Final 
        logger.info("✅ ETL pipeline successfully completed")
        return True
    except Exception as e:
        logger.error(f"❌ Error in ETL pipeline : {str(e)}")
        return False

if __name__ == "__main__":
    run_pipeline()