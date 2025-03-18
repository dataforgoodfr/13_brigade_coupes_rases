import os
import boto3
from dotenv import load_dotenv
from typing import Optional

class S3Manager:
    def __init__(self):
        load_dotenv()
        kwargs = {
            "service_name": "s3",
            "region_name": os.getenv("S3_REGION"),
            "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
            "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        }
        endpoint=os.getenv("S3_ENDPOINT")
        if endpoint:
            kwargs["endpoint_url"] = endpoint

        self.s3 = boto3.client(**kwargs)
        self.bucket_name = os.getenv("S3_BUCKET_NAME")

    def file_check(self, s3_key_prefix: str, my_filename: str) -> bool:
        """
        Check if a file exists in the specified S3 bucket and prefix.

        :param s3_key_prefix: The S3 key prefix to search within.
        :param my_filename: The filename to check for.
        :return: True if the file is found, False otherwise.
        """
        try:
            response = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=s3_key_prefix)
            contents = response.get("Contents", [])
            for obj in contents:
                filename = obj["Key"].split("/")[-1]
                if filename == my_filename:
                    print(f"✅ File found in S3: {my_filename}")
                    return True
            print(f"ℹ️ File not found in S3: {my_filename}")
            return False
        except Exception as e:
            print(f"❌ Error checking file in S3: {e}")
            return False

    def load_file_memory(self, s3_key: str) -> str:
        """
        Load a file from S3 into memory.

        :param s3_key: The S3 key of the file to load.
        :return: The content of the file as a string.
        """
        try:
            response = self.s3.get_object(Bucket=self.bucket_name, Key=s3_key)
            metadata_content = response["Body"].read().decode("utf-8")
            print(f"✅ File loaded into memory from S3: {s3_key}")
            return metadata_content
        except Exception as e:
            print(f"❌ Error loading file from S3: {e}")
            raise

    def download_from_s3(self, s3_key: str, download_path: str) -> None:
        """
        Download a file from S3 to a local path.

        :param s3_key: The S3 key of the file to download.
        :param download_path: The local path to save the downloaded file.
        """
        os.makedirs(os.path.dirname(download_path), exist_ok=True)
        try:
            with open(download_path, "wb") as f:
                self.s3.download_fileobj(self.bucket_name, s3_key, f)
            print(f"✅ File downloaded from S3: {download_path}")
        except Exception as e:
            print(f"❌ Error downloading file from S3: {e}")

    def delete_from_s3(self, s3_key: str) -> None:
        """
        Delete a file from S3.

        :param s3_key: The S3 key of the file to delete.
        """
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=s3_key)
            print(f"✅ File deleted successfully: {s3_key}")
        except Exception as e:
            print(f"❌ Error deleting file from S3: {e}")

    def upload_to_s3(self, file_path: str, s3_key: str) -> None:
        """
        Upload a local file to S3.

        :param file_path: The local path of the file to upload.
        :param s3_key: The S3 key to store the uploaded file under.
        """
        try:
            with open(file_path, "rb") as f:
                self.s3.upload_fileobj(f, self.bucket_name, s3_key)
            print(f"✅ File uploaded successfully: {s3_key}")
        except Exception as e:
            print(f"❌ Error uploading file to S3: {e}")