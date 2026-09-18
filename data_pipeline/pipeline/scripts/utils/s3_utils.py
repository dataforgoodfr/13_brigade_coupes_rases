import logging
import os

import boto3
from dotenv import load_dotenv


class S3Manager:
    load_dotenv()

    def __init__(self) -> None:
        # Mêmes noms de variables que le backend (backend/app/config.py)
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        self.s3 = boto3.client(
            service_name="s3",
            region_name=os.getenv("S3_REGION", "fr-par"),
            endpoint_url=os.getenv("S3_ENDPOINT"),
            aws_access_key_id=os.getenv("S3_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
        )

    def list_bucket_contents(self) -> list[str] | None:
        try:
            result = self.s3.list_objects_v2(Bucket=self.bucket_name)
            content_list: list[str] = []
            if "Contents" in result:
                # Récupère les données dans le bucket
                for obj in result["Contents"]:
                    content_list.append(obj["Key"])
            else:
                logging.warning("The bucket is empty or inaccessible.")
            return content_list
        except Exception as e:
            logging.warning(f"Error reading bucket: {e}")
            return None

    def download_from_s3(self, s3_key: str, download_path: str) -> None:
        try:
            with open(download_path, "wb") as f:
                self.s3.download_fileobj(self.bucket_name, s3_key, f)
            logging.info(f"File downloaded from S3: {download_path}")
        except Exception as e:
            logging.warning(f"Error downloading file from S3: {e}")

    def delete_from_s3(self, s3_key: str) -> None:
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logging.info(f"File successfully deleted from S3: {s3_key}")
        except Exception as e:
            logging.warning(f"Error deleting file from S3: {e}")

    def upload_to_s3(self, file_path: str, s3_key: str) -> None:
        try:
            with open(file_path, "rb") as f:
                self.s3.upload_fileobj(f, self.bucket_name, s3_key)
            logging.info(f"File successfully uploaded to S3: {s3_key}")
        except Exception as e:
            logging.warning(f"Error uploading file to S3: {e}")
