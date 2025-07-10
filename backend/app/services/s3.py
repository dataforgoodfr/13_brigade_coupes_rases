import re
import uuid

import boto3
from botocore.exceptions import ClientError

from app.config import settings


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for S3 storage"""
    # Remove or replace problematic characters
    sanitized = re.sub(r"[^\w\-_.]", "_", filename)
    # Remove multiple consecutive underscores
    sanitized = re.sub(r"_{2,}", "_", sanitized)
    # Remove leading/trailing underscores
    sanitized = sanitized.strip("_")
    return sanitized


class S3Service:
    """Service for handling S3 operations and pre-signed URLs"""

    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION,
            endpoint_url=settings.S3_ENDPOINT,
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self.prefix = settings.S3_PREFIX

    def generate_presigned_upload_url(
        self,
        filename: str,
        content_type: str,
        report_id: str | None = None,
        expires_in: int = 3600,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB default
    ) -> dict:
        """
        Generate a pre-signed URL for uploading a file to S3

        Args:
            filename: Original filename
            content_type: MIME type of the file
            report_id: Optional report ID to organize files
            expires_in: URL expiration time in seconds (default 1 hour)
            max_file_size: Maximum allowed file size in bytes

        Returns:
            Dict containing upload_url, file_url, expires_in, and key
        """
        try:
            # Sanitize and create unique filename
            sanitized_filename = sanitize_filename(filename)
            name_without_ext = (
                sanitized_filename.rsplit(".", 1)[0]
                if "." in sanitized_filename
                else sanitized_filename
            )
            extension = (
                sanitized_filename.rsplit(".", 1)[1]
                if "." in sanitized_filename
                else ""
            )

            # Create unique filename with UUID prefix
            unique_filename = f"{uuid.uuid4()}_{name_without_ext}"
            if extension:
                unique_filename += f".{extension}"

            # Construct S3 key with proper organization
            key_parts = [self.prefix] if self.prefix else []
            if report_id:
                key_parts.append(f"reports/{report_id}")
            key_parts.append(unique_filename)

            s3_key = "/".join(key_parts)

            # Define conditions for the pre-signed POST
            conditions = [
                {"bucket": self.bucket_name},
                {"key": s3_key},
                {"Content-Type": content_type},
                ["content-length-range", 1, max_file_size],  # File size limits
            ]

            # Generate pre-signed POST URL
            presigned_post = self.client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    "Content-Type": content_type,
                },
                Conditions=conditions,
                ExpiresIn=expires_in,
            )

            # Construct the file URL for accessing the uploaded file
            file_url = f"{settings.S3_ENDPOINT}/{self.bucket_name}/{s3_key}"

            return {
                "upload_url": presigned_post["url"],
                "fields": presigned_post["fields"],
                "file_url": file_url,
                "expires_in": expires_in,
                "key": s3_key,
            }

        except ClientError as e:
            raise Exception(f"Failed to generate pre-signed URL: {str(e)}") from e

    def generate_presigned_get_url(
        self,
        s3_key: str,
        expires_in: int = 3600,
    ) -> str:
        """
        Generate a pre-signed URL for viewing/downloading a file from S3

        Args:
            s3_key: S3 key/path of the file to view
            expires_in: URL expiration time in seconds (default 1 hour)

        Returns:
            Pre-signed URL string for viewing the file
        """
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": s3_key,
                },
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate pre-signed GET URL: {str(e)}") from e


# Singleton instance
s3_service = S3Service()
