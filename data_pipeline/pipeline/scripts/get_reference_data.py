import logging
from tqdm import tqdm
from pathlib import Path
from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import S3Manager

def get_enrichment_data():
    logging.info("Getting enrichment data...")
    s3_manager = S3Manager()
    # TODO: mettre cette liste dans un fichier de config
    reference_data = [
        "data_pipeline/bronze/reference_data/bdforet/bdforet.fgb",
        "data_pipeline/bronze/reference_data/cadastre_cities/cadastre_cities.fgb",
        "data_pipeline/bronze/reference_data/natura2000/natura2000_concat.fgb",
        "data_pipeline/bronze/reference_data/natura2000/natura2000_union.fgb",
        "data_pipeline/bronze/reference_data/slope/slope_gte_30.fgb",
    ]

    for data_path in tqdm(reference_data, desc="Downloading files"):
        relative_path = data_path.split("reference_data")[-1].lstrip("/")
        local_path = DATA_DIR / relative_path

        if local_path.exists():
            logging.info(f"File already exists, skipping: {local_path.name}")
            continue

        local_path.parent.mkdir(parents=True, exist_ok=True)        
        s3_manager.download_from_s3(data_path, str(local_path))
    
    logging.info("Enrichment data downloaded.")
