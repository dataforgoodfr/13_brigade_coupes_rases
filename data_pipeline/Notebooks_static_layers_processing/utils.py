import logging
import os

import boto3
import requests
from dotenv import find_dotenv, load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s][%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)


def download_file(url: str, save_path: str):
    """Download a file from a URL and save it to a specified location."""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)  # Ensure the directory exists

    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(save_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        logging.info(f"File downloaded successfully: {save_path}")
    else:
        logging.info(f"Failed to download file. Status code: {response.status_code}")


class S3Manager:
    """
    A class to manage S3 operations for ETL processes.

    This class provides methods for interacting with an S3-compatible storage service,
    including checking for files, uploading, downloading, and deleting objects.
    It uses environment variables for configuration.

    Attributes
    ----------
    s3 : boto3.client
        The boto3 S3 client instance.
    bucket_name : str
        The name of the S3 bucket to use for operations.
    logger : Logger
        Logger instance for recording operations and errors.
    """

    # Load environment variables
    load_dotenv(find_dotenv())

    def __init__(self):
        """
        Initializes the S3Manager with configuration from environment variables.

        Creates a boto3 S3 client using credentials and endpoint information
        from environment variables, and sets up logging.
        """
        self.s3 = boto3.client(
            service_name="s3",
            region_name=os.getenv("S3_REGION"),
            endpoint_url=os.getenv("S3_ENDPOINT"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        self.logger = logging

    def file_check(self, s3_key_prefix: str, my_filename: str) -> bool:
        """
        Checks if a file exists in the S3 bucket under the specified prefix.

        This method lists objects in the bucket with the given prefix and
        checks if any of them match the provided filename.

        Parameters
        ----------
        s3_key_prefix : str
            The prefix (folder path) to search within the bucket.
        my_filename : str
            The filename to look for in the bucket.

        Returns
        -------
        bool
            True if the file exists in S3, False otherwise.
        """
        try:
            in_s3 = False
            response = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=s3_key_prefix)
            if "Contents" in response:
                for obj in response["Contents"]:
                    filename = obj["Key"].split("/")[-1]
                    if filename == my_filename:
                        in_s3 = True
                        self.logger.info(f"✅ File found in S3: {my_filename}")
                        break
            if not in_s3:
                self.logger.info(f"❌ File not found in S3: {my_filename}")
            return in_s3
        except Exception as e:
            self.logger.warning(f"❌ Error checking file in S3: {e}")
            return False

    def load_file_memory(self, s3_key: str) -> str:
        """
        Loads a file from S3 into memory.

        This method retrieves an object from the S3 bucket and
        returns its contents as a UTF-8 decoded string.

        Parameters
        ----------
        s3_key : str
            The complete S3 key (path and filename) of the object to load.

        Returns
        -------
        str
            The contents of the file as a string.

        Raises
        ------
        Exception
            If there's an error retrieving the file from S3.
        """
        try:
            response = self.s3.get_object(Bucket=self.bucket_name, Key=s3_key)
            metadata_content = response["Body"].read().decode("utf-8")
            self.logger.info(f"✅ File loaded into memory from S3: {s3_key}")
            return metadata_content
        except Exception as e:
            self.logger.warning(f"❌ Error loading file from S3: {e}")
            raise

    def download_from_s3(self, s3_key: str, download_path: str) -> None:
        """
        Downloads a file from S3 to a local path.

        This method retrieves an object from the S3 bucket and
        saves it to the specified local file path.

        Parameters
        ----------
        s3_key : str
            The complete S3 key of the object to download.
        download_path : str
            The local file path where the downloaded file will be saved.

        Raises
        ------
        Exception
            If there's an error downloading the file from S3.
        """
        try:
            with open(download_path, "wb") as f:
                self.s3.download_fileobj(self.bucket_name, s3_key, f)
            self.logger.info(f"✅ File downloaded from S3: {download_path}")
        except Exception as e:
            self.logger.warning(f"❌ Error downloading file from S3: {e}")

    def delete_from_s3(self, s3_key: str) -> None:
        """
        Deletes an object from the S3 bucket.

        This method removes an object with the specified key from the S3 bucket.

        Parameters
        ----------
        s3_key : str
            The complete S3 key of the object to delete.

        Raises
        ------
        Exception
            If there's an error deleting the file from S3.
        """
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=s3_key)
            self.logger.info(f"✅ File successfully deleted: {s3_key}")
        except Exception as e:
            self.logger.warning(f"❌ Error deleting file from S3: {e}")

    def upload_to_s3(self, file_path: str, s3_key: str) -> None:
        """
        Uploads a local file to the S3 bucket.

        This method reads a file from the local filesystem and
        uploads it to the S3 bucket with the specified key.

        Parameters
        ----------
        file_path : str
            The path to the local file to upload.
        s3_key : str
            The complete S3 key where the file will be stored.

        Raises
        ------
        Exception
            If there's an error uploading the file to S3.
        """
        try:
            with open(file_path, "rb") as f:
                self.s3.upload_fileobj(f, self.bucket_name, s3_key)
            self.logger.info(f"✅ File uploaded successfully: {s3_key}")
        except Exception as e:
            self.logger.warning(f"❌ Error uploading file to S3: {e}")
