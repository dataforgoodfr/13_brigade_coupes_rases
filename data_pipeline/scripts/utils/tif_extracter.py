import json
import requests
from datetime import datetime
from utils.s3 import S3Manager
from utils.logging_etl import etl_logger


class ExtractFromSufosat:
    """
    Class to extract data from Sufosat and upload it to S3.

    Attributes
    ----------
    s3_manager (S3Manager):
        Instance of S3Manager to handle S3 operations.
    logger (Logger):
        Logger instance for logging messages.
    """

    def __init__(self):
        self.s3_manager = S3Manager()
        self.logger = etl_logger("logs/extract.log")

    def check_tif_in_s3(self, s3_prefix, s3_filename) -> bool:
        """
        Check if a file exists in S3.
        parameters
        -----------
        s3_prefix: str
            The S3 prefix to search within
        s3_filename: str
            The filename to check for

        returns
        --------
        bool
            False if the file is not found in S3, True otherwise.
        """
        self.logger.info("Checking file in S3...")
        in_s3 = False
        try:
            result = self.s3_manager.file_check(s3_prefix, s3_filename)
            if result:
                self.logger.info("✅ The file is in S3")
            else:
                self.logger.info("✅ The file is not in S3")
            in_s3 = result
        except Exception:
            self.logger.warning("❌ Failed to verify on S3")

        return in_s3

    def check_for_updates(self, query: str, id: str):
        """
        Check if the metadata has been updated by comparing dates.
        parameters
        -----------
        query: str
            The filename to check for
        id: str
            The ID of the record to check
        returns
        --------
        dict
            A dictionary containing the update status and metadata.
        """
        self.logger.info("Checking for updates...")

        url = f"https://zenodo.org/api/records/{id}/files/{query}"
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            data = response.json()
        else:
            raise Exception(f"Error during API request: {response.status_code}")

        metadata_content = self.s3_manager.load_file_memory(
            s3_key="dataeng/sufosat_data/forest-clearcuts_mainland-france_sufosat_dates_v3-metadata.json"  # supose to be the same
        )
        metadata = json.loads(metadata_content)

        date_format = "%Y-%m-%dT%H:%M:%S"
        base_date = datetime.strptime(metadata["date_source"].split(".")[0], date_format)
        date_extracted = datetime.strptime(data["updated"].split(".")[0], date_format)

        do_update = base_date < date_extracted
        self.logger.info(f"✅ Metadata inspection completed, update required: {do_update}")

        return {"do_update": do_update, "metadata": data, "mymetadata": metadata}

    def extract_tif_data_and_upload(self, id: str, query: str, s3_key: str):
        """
        Extract the data from Zenodo and upload it to S3.
        parameters
        -----------
        id: str
            The ID of the record to extract
        query: str
            The filename to extract
        s3_key: str
            The S3 key where the file will be uploaded
        """
        self.logger.info("Extract the data from Zendo...")

        with requests.get(
            f"https://zenodo.org/records/{id}/files/{query}?download=1", stream=True
        ) as r:
            r.raise_for_status()
            self.s3_manager.s3.upload_fileobj(r.raw, self.s3_manager.bucket_name, s3_key)

        self.logger.info(f"✅ File loaded successfully {s3_key}")

    def update_metadata(self, s3_prefix, filename, update: dict):
        """
        Update the metadata file in S3.
        parameters
        -----------
        s3_prefix: str
            The S3 prefix to search within
        filename: str
            The filename to check for
        update: dict
            The metadata update information
        """
        my_metadata = update["mymetadata"]
        metadata = update["metadata"]

        if not my_metadata or "version" not in my_metadata:
            version = 1
        else:
            version = my_metadata.get("version", 0) + 1

        meta_data = {
            "version": version,
            "s3_key": s3_prefix + filename,
            "bucket_name": self.s3_manager.bucket_name,
            "data_source_link": metadata["links"]["self"],
            "date_source": metadata["updated"],
            "file_name": metadata["key"],
            "date_extract": datetime.now().strftime("%Y-%m-%d"),
            "size": metadata["size"],
            "mimetype": metadata["mimetype"],
            "metadata": metadata["metadata"],
        }

        meta_data_json = json.dumps(meta_data)
        existing_keys = self.s3_manager.file_check(s3_prefix, filename)
        if existing_keys:
            self.s3_manager.delete_from_s3(s3_prefix + filename)

        self.s3_manager.s3.put_object(
            Body=meta_data_json, Bucket=self.s3_manager.bucket_name, Key=s3_prefix + filename
        )

        self.logger.info("✅ The metadata was been update !")
