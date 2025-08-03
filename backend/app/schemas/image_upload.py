from typing import Any

from pydantic import Field

from app.schemas.base import BaseSchema


class ImageUploadRequest(BaseSchema):
    """Request schema for generating pre-signed upload URL"""

    filename: str = Field(..., description="Name of the file to upload")
    content_type: str = Field(
        ..., description="MIME type of the file (e.g., image/jpeg, image/png)"
    )
    file_size: int | None = Field(None, description="Size of the file in bytes")
    report_id: str | None = Field(
        None, description="ID of the clear cut report this image belongs to"
    )


class ImageUploadResponse(BaseSchema):
    """Response schema for pre-signed upload URL"""

    upload_url: str = Field(..., description="Pre-signed URL for uploading the file")
    fields: dict[str, Any] = Field(
        ..., description="Fields to include in the POST request"
    )
    file_url: str = Field(
        ..., description="URL to access the uploaded file after upload"
    )
    expires_in: int = Field(
        ..., description="Number of seconds until the upload URL expires"
    )
    key: str = Field(..., description="S3 key/path of the uploaded file")
