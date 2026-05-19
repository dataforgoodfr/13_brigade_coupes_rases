from logging import getLogger
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

from app.common.errors import AppHTTPException
from app.config import settings
from app.schemas.base import BaseSchema
from app.schemas.image_upload import ImageUploadRequest, ImageUploadResponse
from app.services.s3 import s3_service
from app.services.user_auth import get_current_user, get_optional_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/images", tags=["Images"])

LOCAL_UPLOADS_PATH = Path("/app/uploads")

ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

EXTENSION_TO_MIME = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "heic": "image/jpeg",
    "heif": "image/jpeg",
}


def infer_content_type(filename: str, declared: str) -> str:
    if declared and declared in ALLOWED_TYPES:
        return declared
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return EXTENSION_TO_MIME.get(ext, declared or "image/jpeg")


def is_s3_configured() -> bool:
    return bool(settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY)


class ImageViewResponse(BaseSchema):
    view_url: str
    expires_in: int


@router.post(
    "/upload-url",
    response_model=ImageUploadResponse,
    response_model_exclude_none=True,
)
def generate_upload_url(
    request: Request,
    upload_request: ImageUploadRequest,
    _=Depends(get_current_user),
):
    content_type = infer_content_type(
        upload_request.filename, upload_request.content_type
    )

    if content_type not in ALLOWED_TYPES:
        raise AppHTTPException(
            status_code=400,
            type="INVALID_CONTENT_TYPE",
            detail=f"Type de fichier non autorisé. Types acceptés : {ALLOWED_TYPES}",
        )

    max_size = 10 * 1024 * 1024
    if upload_request.file_size and upload_request.file_size > max_size:
        raise AppHTTPException(
            status_code=400,
            type="FILE_SIZE_EXCEEDED",
            detail=f"Fichier trop volumineux ({upload_request.file_size} octets). Taille maximale : {max_size} octets.",
        )

    if not is_s3_configured():
        import uuid as uuid_module

        file_id = str(uuid_module.uuid4())
        filename = upload_request.filename or "photo.jpg"
        if upload_request.report_id:
            key = f"local/reports/{upload_request.report_id}/{file_id}_{filename}"
        else:
            key = f"local/{file_id}_{filename}"

        base_url = str(request.base_url).rstrip("/")
        return ImageUploadResponse(
            upload_url=f"{base_url}/api/v1/images/local-upload",
            fields={"key": key, "Content-Type": content_type},
            file_url=f"{base_url}/api/v1/images/local/{key}",
            expires_in=3600,
            key=key,
        )

    try:
        result = s3_service.generate_presigned_upload_url(
            filename=upload_request.filename,
            content_type=content_type,
            report_id=upload_request.report_id,
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
        raise AppHTTPException(
            status_code=500, detail="Impossible de générer l'URL d'upload."
        ) from e


@router.post("/local-upload", status_code=204)
async def local_upload(
    key: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
):
    """Fallback local file storage — utilisé uniquement en développement quand S3 n'est pas configuré."""
    relative_key = key.removeprefix("local/")
    file_path = LOCAL_UPLOADS_PATH / relative_key
    file_path.parent.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    file_path.write_bytes(content)


@router.get("/local/{key:path}")
async def get_local_file(
    key: str,
    _=Depends(get_optional_current_user),
):
    """Sert les fichiers uploadés localement en développement."""
    file_path = LOCAL_UPLOADS_PATH / key.removeprefix("local/")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    return FileResponse(file_path)


@router.get(
    "/view/{s3_key:path}",
    response_model=ImageViewResponse,
    response_model_exclude_none=True,
)
def generate_view_url(
    request: Request,
    s3_key: str,
    _=Depends(get_current_user),
):
    if s3_key.startswith("local/"):
        base_url = str(request.base_url).rstrip("/")
        # strip the "local/" prefix so the URL path is /local/{relative_path}
        # matching how the file was actually saved (without the "local/" directory)
        relative = s3_key.removeprefix("local/")
        return ImageViewResponse(
            view_url=f"{base_url}/api/v1/images/local/{relative}",
            expires_in=3600,
        )

    try:
        view_url = s3_service.generate_presigned_get_url(
            s3_key=s3_key,
            expires_in=3600,
        )
        return ImageViewResponse(view_url=view_url, expires_in=3600)
    except Exception as e:
        logger.error(f"Failed to generate view URL for {s3_key}: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Impossible de générer l'URL de visualisation."
        ) from e
