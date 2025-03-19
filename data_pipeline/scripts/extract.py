import json
import requests
from datetime import datetime
from utils.s3 import S3Manager
from utils.logging import etl_logger


# Load configurations
s3_manager = S3Manager()
logger = etl_logger("etl.extract")


def check_tif_in_s3(s3_prefix: str, s3_filename: str) -> bool:
    """
    Checks if a TIF file exists in S3 storage.
    
    This function verifies whether a specific file exists in the S3 bucket
    at the given prefix location and logs the result.
    
    Parameters
    ----------
    s3_prefix : str
        The S3 prefix (folder path) where the file should be located.
    s3_filename : str
        The name of the file to check for in S3.
        
    Returns
    -------
    bool
        True if the file exists in S3, False otherwise.
    """
    in_s3 = False
    result = s3_manager.file_check(s3_prefix, s3_filename)
    if result:
        logger.info("✅ The file in S3")
    else:
        logger.info("✅ The file is not in S3")
    in_s3 = result
    
    return in_s3


def data_update(query: str, id: str, s3_prefix: str, s3_sufosat_metadata: str) -> dict:
    """
    Compares local and remote metadata to determine if an update is needed.
    
    This function fetches metadata from Zenodo for a specific file and compares
    it with the stored metadata in S3 to determine if the local copy needs to be updated.
    It checks the timestamps to make this determination.
    
    Parameters
    ----------
    query : str
        The filename to query in the Zenodo API.
    id : str
        The Zenodo record ID.
    s3_prefix : str
        The S3 prefix (folder path) where metadata is stored.
    s3_sufosat_metadata : str
        The filename of the metadata file in S3.
        
    Returns
    -------
    dict
        A dictionary containing:
        - 'do_update': bool - Whether an update is required
        - 'metadata': dict - The Zenodo metadata
        - 'mymetadata': dict - The existing S3 metadata
        
    Raises
    ------
    Exception
        If the API request to Zenodo fails.
    """
    url = f"https://zenodo.org/api/records/{id}/files/{query}"
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        data = response.json()
    else:
        raise Exception(f"❌ Error during API request : {response.status_code}")
    
    metadata_content = s3_manager.load_file_memory(s3_key=s3_prefix+s3_sufosat_metadata)
    metadata = json.loads(metadata_content)

    date_format = "%Y-%m-%dT%H:%M:%S"
    base_date = datetime.strptime(metadata["date_source"].split(".")[0], date_format)
    date_extracted = datetime.strptime(data["updated"].split(".")[0], date_format)

    do_update = base_date < date_extracted
    logger.info(f"✅ Metadata inspection performed, update required : {do_update}")
    
    return {
       "do_update" : do_update, 
       "metadata" : data, 
       "mymetadata" : metadata
    }


def extract_tif_data_and_upload(id: str, query: str, s3_key: str) -> None:
    """
    Downloads a TIF file from Zenodo and uploads it to S3.
    
    This function fetches a file from Zenodo using the provided record ID
    and filename, then streams it directly to S3 without saving locally.
    
    Parameters
    ----------
    id : str
        The Zenodo record ID.
    query : str
        The filename to download from Zenodo.
    s3_key : str
        The complete S3 key (including prefix and filename) where the file will be stored.
        
    Raises
    ------
    requests.exceptions.HTTPError
        If the download from Zenodo fails.
    """
    with requests.get(
        f"https://zenodo.org/records/{id}/files/{query}?download=1", 
        stream=True) as r:
        r.raise_for_status()
        s3_manager.s3.upload_fileobj(r.raw, s3_manager.bucket_name, s3_key)
    logger.info(f"✅ File loaded successfully {s3_key}")


def update_metadata(s3_prefix: str, filename: str, update: dict) -> None:
    """
    Updates the metadata file in S3 with new information.
    
    This function creates or updates a metadata file in S3 with information
    from both the Zenodo API and the existing metadata. It increments the version
    number if the metadata file already exists.
    
    Parameters
    ----------
    s3_prefix : str
        The S3 prefix (folder path) where metadata will be stored.
    filename : str
        The filename of the metadata file in S3.
    update : dict
        A dictionary containing:
        - 'mymetadata': dict - The existing metadata from S3
        - 'metadata': dict - The new metadata from Zenodo
        
    Notes
    -----
    If the metadata file already exists, it will be deleted and replaced.
    """
    my_metadata = update["mymetadata"]
    metadata = update["metadata"]

    if not my_metadata or "version" not in my_metadata:
        version = 1
    else:
        version = my_metadata["version"] + 1

    meta_data = {
        "version": version,
        "s3_key": s3_prefix+filename,
        "bucket_name": s3_manager.bucket_name,
        "data_source_link": metadata["links"]["self"],
        "date_source": metadata["updated"],
        "file_name": metadata["key"],
        "date_extract": datetime.now().strftime("%Y-%m-%d"),
        "size": metadata["size"],
        "mimetype": metadata["mimetype"],
        "metadata": metadata["metadata"]
    }

    meta_data_json = json.dumps(meta_data)
    existing_keys = s3_manager.file_check(s3_prefix, filename)
    if existing_keys:
        s3_manager.delete_from_s3(s3_prefix + filename)
    
    s3_manager.s3.put_object(
            Body=meta_data_json, 
            Bucket=s3_manager.bucket_name,
            Key=s3_prefix + filename
        )

    logger.info(f"✅ The metadata has been updated!")