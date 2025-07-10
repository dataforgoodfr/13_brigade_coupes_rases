from logging import getLogger

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.schemas.image_upload import ImageUploadRequest, ImageUploadResponse
from app.services.s3 import s3_service
from app.services.user_auth import get_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/images", tags=["Images"])


class ImageViewResponse(BaseModel):
    """Response schema for image viewing URL"""

    view_url: str
    expires_in: int


@router.post("/upload-url", response_model=ImageUploadResponse)
def generate_upload_url(
    request: ImageUploadRequest,
    _=Depends(get_current_user),
):
    """
    Generate a pre-signed URL for uploading an image to S3

    The frontend can use this URL to upload the image directly to S3.
    """
    try:
        # Validate content type
        allowed_types = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ]
        if request.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Content type {request.content_type} not allowed. Allowed types: {allowed_types}",
            )

        # Set file size limit based on content type
        max_size = 10 * 1024 * 1024  # 10MB for images
        if request.file_size and request.file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File size {request.file_size} exceeds maximum allowed size of {max_size} bytes",
            )

        # Generate pre-signed URL
        result = s3_service.generate_presigned_upload_url(
            filename=request.filename,
            content_type=request.content_type,
            report_id=request.report_id,
            max_file_size=max_size,
        )

        return ImageUploadResponse(
            upload_url=result["upload_url"],
            fields=result["fields"],
            file_url=result["file_url"],
            expires_in=result["expires_in"],
            key=result["key"],
        )

    except Exception as e:
        logger.error(f"Failed to generate upload URL: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to generate upload URL"
        ) from e


@router.get("/view/{s3_key:path}", response_model=ImageViewResponse)
def generate_view_url(
    s3_key: str,
    _=Depends(get_current_user),
):
    """
    Generate a pre-signed URL for viewing an image from S3

    The s3_key should be the full S3 key path (e.g., "development/reports/123/uuid_image.jpg")
    """
    try:
        expires_in = 3600  # 1 hour
        view_url = s3_service.generate_presigned_get_url(
            s3_key=s3_key,
            expires_in=expires_in,
        )

        return ImageViewResponse(
            view_url=view_url,
            expires_in=expires_in,
        )

    except Exception as e:
        logger.error(f"Failed to generate view URL for {s3_key}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to generate view URL"
        ) from e
