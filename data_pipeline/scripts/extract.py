import json
import requests
from datetime import datetime
from utils.s3 import S3Manager
from utils.logging import etl_logger

# Configuration
s3_manager = S3Manager()
logger = etl_logger("logs/extract.log")


# Charger la configuration
def check_tif_in_s3(s3_prefix, s3_filename):
    in_s3 = False
    try:
        result = s3_manager.file_check(s3_prefix, s3_filename)
        if result:
            logger.info("✅Le fichier est dans S3")
        else:
            etl_logger.info("✅Le fichier n'est pas dans S3")
        in_s3 = result
    except Exception:
        logger.warning("❌ Echec de la verification sur S3")

    return in_s3


def data_update(query: str, id: str):
    url = f"https://zenodo.org/api/records/{id}/files/{query}"
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        data = response.json()
    else:
        raise Exception(f"Erreur lors de la requête API : {response.status_code}")

    metadata_content = s3_manager.load_file_memory(
        s3_key="dataeng/sufosat_data/forest-clearcuts_mainland-france_sufosat_dates_v3-metadata.json"
    )
    metadata = json.loads(metadata_content)

    date_format = "%Y-%m-%dT%H:%M:%S"
    base_date = datetime.strptime(metadata["date_source"].split(".")[0], date_format)
    date_extracted = datetime.strptime(data["updated"].split(".")[0], date_format)

    do_update = base_date < date_extracted
    logger.info(f"✅ Inspection de la metadata effectuée, mise à jour requise : {do_update}")

    return {"do_update": do_update, "metadata": data, "mymetadata": metadata}


def extract_tif_data_and_upload(id: str, query: str, s3_key: str):
    with requests.get(
        f"https://zenodo.org/records/{id}/files/{query}?download=1", stream=True
    ) as r:
        r.raise_for_status()
        s3_manager.s3.upload_fileobj(r.raw, s3_manager.bucket_name, s3_key)
    logger.info("✅ Fichier chargé avec succeès {s3_key}")


def update_metadata(s3_prefix, filename, update: dict):
    my_metadata = update["mymetadata"]
    metadata = update["metadata"]

    if not my_metadata or "version" not in my_metadata:
        version = 1
    else:
        version = my_metadata["version"] + 1

    meta_data = {
        "version": version,
        "s3_key": s3_prefix + filename,
        "bucket_name": s3_manager.bucket_name,
        "data_source_link": metadata["links"]["self"],
        "date_source": metadata["updated"],
        "file_name": metadata["key"],
        "date_extract": datetime.now().strftime("%Y-%m-%d"),
        "size": metadata["size"],
        "mimetype": metadata["mimetype"],
        "metadata": metadata["metadata"],
    }

    meta_data_json = json.dumps(meta_data)
    existing_keys = s3_manager.file_check(s3_prefix, filename)
    if existing_keys:
        s3_manager.delete_from_s3(s3_prefix + filename)

    s3_manager.s3.put_object(
        Body=meta_data_json, Bucket=s3_manager.bucket_name, Key=s3_prefix + filename
    )

    logger.info("✅ La metadata a été mise à jour !")
