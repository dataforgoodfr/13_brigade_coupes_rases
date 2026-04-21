import logging
from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import S3Manager


def upload_gold_to_s3():
    s3_manager = S3Manager()
    current_key = "data_pipeline/gold/sufosat/current/sufosat_clusters_enriched.fgb"
    previous_key = "data_pipeline/gold/sufosat/previous/sufosat_clusters_enriched.fgb"

    bucket_contents = s3_manager.list_bucket_contents()

    if current_key in bucket_contents:
        logging.info("Rotating current gold to previous...")
        tmp_path = DATA_DIR / "sufosat_reference" / "sufosat_clusters_enriched_current_backup.fgb"
        tmp_path.parent.mkdir(parents=True, exist_ok=True)

        s3_manager.download_from_s3(current_key, str(tmp_path))
        s3_manager.upload_to_s3(str(tmp_path), previous_key)
        s3_manager.delete_from_s3(current_key)
        logging.info("Rotation current -> previous done.")

    new_gold_path = DATA_DIR / "sufosat" / "clusters_final.fgb"
    logging.info(f"Uploading new gold to S3: {current_key}")
    s3_manager.upload_to_s3(str(new_gold_path), current_key)
    logging.info("New gold uploaded to S3.")
