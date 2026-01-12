import os
import logging
import geopandas as gpd
from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import S3Manager


def get_last_version():
    logging.info("Getting last version...")
    s3_manager = S3Manager()
    prefix = "data_pipeline/gold/sufosat/"
    gold_files = []

    # Collecter tous les fichiers gold
    for content in s3_manager.list_bucket_contents():
        if content.startswith(prefix):
            # Extraire l'id du chemin (ex: "data_pipeline/gold/sufosat/15004634/...")
            parts = content.split("/")
            if len(parts) > 3:
                try:
                    file_id = int(parts[3])  # L'id est à la position 3
                    gold_files.append({
                        "id": file_id,
                        "path": content
                    })
                except ValueError:
                    continue

    # Trouver le fichier avec l'id maximum
    if gold_files:
        os.makedirs(str(DATA_DIR / "sufosat_reference"), exist_ok=True)
        latest_gold = max(gold_files, key=lambda x: x["id"])
        latest_gold_path = latest_gold["path"]
        s3_manager.download_from_s3(
            latest_gold_path, 
            str(DATA_DIR / "sufosat_reference" / latest_gold_path.split("/")[-1])
        )
        
        gdf_latest = gpd.read_file(
            str(DATA_DIR / "sufosat_reference"/ latest_gold_path.split("/")[-1])
        )
        max_date = gdf_latest["date_max"].max()

        return max_date
