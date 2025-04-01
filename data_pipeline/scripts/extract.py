import yaml
from utils.s3 import S3Manager
from utils.logging_etl import etl_logger
from utils.tif_extracter import ExtractFromSufosat


def extract_tif_data():
    extract_sufosat = ExtractFromSufosat()
    logger = etl_logger("logs/extract.log")
    s3_manager = S3Manager()
    with open("config/config.yaml") as stream:
        configs = yaml.safe_load(stream)

    file_exists = extract_sufosat.check_tif_in_s3(
        configs["extract_sufosat"]["s3_prefix"], 
        configs["extract_sufosat"]["s3_filename"]
    )

    update_info = extract_sufosat.check_for_updates(
        configs["extract_sufosat"]["zendo_filename"], 
        configs["extract_sufosat"]["zendo_id"]
    )

    # Conditionnaly download the file
    if update_info["do_update"]:
        logger.info("Extract the data from Zendo...")
        extract_tif_data_and_upload(
            configs["extract_sufosat"]["zendo_id"],
            configs["extract_sufosat"]["zendo_filename"],
            configs["extract_sufosat"]["s3_prefix"]
            + configs["extract_sufosat"]["zendo_filename"],
        )

        logger.info("Update metadata...")
        update_metadata(
            configs["extract_sufosat"]["s3_prefix"],
            configs["extract_sufosat"]["s3_sufosat_metadata"],
            update_info,
        )

    # Download the file from S3
    else: 
        logger.info("Download from S3...")
        s3_manager.download_from_s3(
            s3_key=configs["extract_sufosat"]["s3_prefix"] 
            + configs["extract_sufosat"]["zendo_filename"], 
            download_path=configs["transform_sufosat"]["download_path"]
            + configs["extract_sufosat"]["zendo_filename"],
        )
