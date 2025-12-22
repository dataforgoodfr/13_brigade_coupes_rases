import logging
import requests
from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import download_file, S3Manager


def get_sufosat_version(data_id: str=15000970) -> dict | None:
    """
        params: 
            data_id (str): general id of the zenodo publication
        returns: 
            dict | None : meta_data usefull to download
    """
    # URL de l'API
    url= f"https://zenodo.org/api/records?q=conceptrecid:{data_id}&sort=mostrecent&size=1"

    try:
        data = requests.get(url).json()["hits"]["hits"][0]
        fichier = data['files'][1]

        new_version = {
            "version": int(data['id']), 
            "filename_key": fichier['key'],
            "file_url_key": 'https://zenodo.org/records/' + str(data['id']) + "/files/" + str(data['files'][1]['key']) + '?download=1' # data[files[1]['key']]--> pour récupérer les dates les probabilités c'est l'index 0
        }
    except requests.exceptions.RequestException as e: 
        print("Requests error :", e)

    return new_version


def local_sufosat_version(
    local_prefix: str="data_pipeline/bronze/sufosat/",
    ) -> dict | None:
    """
        params: 
            local_prefix (str): path of the sufosat files in the bucket
        returns:
            dict | None : meta_data of the local sufosat files
    """   
    s3_manager = S3Manager()
    
    all_files = s3_manager.list_bucket_contents()
    latest_id = str(max([int(e.split("/")[3]) for e in all_files if e.startswith(local_prefix)]))

    for e in all_files:
        if e.startswith(local_prefix) and (e.split("/")[3] == latest_id):
            local_version = {
                "version": int(latest_id),
                "filename_key": e.split("/")[4],
            }
            return local_version


def get_sufosat_tiff(
    local_prefix: str="data_pipeline/bronze/sufosat/",
    ):
    """
        Compare the local sufosat version with the zenodo one and download it if needed
        params: 
            local_prefix (str): path of the sufosat files in the bucket
    """
    s3_manager = S3Manager()
    zenodo_version = get_sufosat_version()
    local_version = local_sufosat_version()
    BASE_DIR = DATA_DIR / "sufosat"
    OUTPUT_DIR = BASE_DIR / zenodo_version["filename_key"]
    
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    if (local_version is None) or (zenodo_version["version"] != local_version["version"]):
        logging.info("New sufosat version detected. Downloading...")

        # Download the data from zenodo to local and in S3
        download_file(
            url = zenodo_version["file_url_key"],
            output_filepath = OUTPUT_DIR
        )

        # Upload the file to S3
        s3_manager.upload_to_s3(
            file_path=OUTPUT_DIR,
            s3_key=f"{local_prefix}{zenodo_version['version']}/{zenodo_version['filename_key']}"
        )
        return True
    else:
        logging.info("Sufosat is up to date.")
        return False
