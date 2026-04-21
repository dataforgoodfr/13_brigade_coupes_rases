import logging
import requests
from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import download_file, S3Manager

LOCAL_PREFIX = "data_pipeline/bronze/sufosat/"


def get_sufosat_version(data_id: str = 15000970) -> dict:
    url = f"https://zenodo.org/api/records?q=conceptrecid:{data_id}&sort=mostrecent&size=1"
    data = requests.get(url).json()["hits"]["hits"][0]
    fichier = data["files"][1]
    return {
        "version": int(data["id"]),
        "filename_key": fichier["key"],
        "file_url": (
            "https://zenodo.org/records/"
            + str(data["id"])
            + "/files/"
            + str(fichier["key"])
            + "?download=1"
        ),
    }


def local_sufosat_version() -> dict | None:
    s3_manager = S3Manager()
    all_files = s3_manager.list_bucket_contents() or []
    bronze_files = [e for e in all_files if e.startswith(LOCAL_PREFIX)]
    if not bronze_files:
        return None
    latest_id = str(max(int(e.split("/")[3]) for e in bronze_files))
    for e in bronze_files:
        if e.split("/")[3] == latest_id:
            return {"version": int(latest_id), "filename_key": e.split("/")[4]}
    return None


def get_sufosat_tiff() -> bool:
    """
    Ensures the latest SUFOSAT tiff is available locally.

    - If Zenodo has a newer version than S3 bronze: downloads from Zenodo, uploads to S3 bronze.
    - If S3 bronze already has the latest version: downloads from S3 bronze to local.
    - Returns True if the tiff is ready for processing, False on error.
    """
    s3_manager = S3Manager()
    zenodo_version = get_sufosat_version()
    local_version = local_sufosat_version()

    BASE_DIR = DATA_DIR / "sufosat"
    BASE_DIR.mkdir(parents=True, exist_ok=True)

    local_path = BASE_DIR / zenodo_version["filename_key"]
    s3_key = f"{LOCAL_PREFIX}{zenodo_version['version']}/{zenodo_version['filename_key']}"

    if local_version is None or zenodo_version["version"] != local_version["version"]:
        logging.info(f"New Zenodo version detected ({zenodo_version['version']}). Downloading...")
        download_file(url=zenodo_version["file_url"], output_filepath=local_path)
        s3_manager.upload_to_s3(str(local_path), s3_key)
    else:
        logging.info(f"Zenodo version {zenodo_version['version']} already in S3 bronze.")
        if not local_path.exists():
            logging.info("Downloading tiff from S3 bronze to local...")
            s3_manager.download_from_s3(s3_key, str(local_path))
        else:
            logging.info("Tiff already available locally.")

    return True
