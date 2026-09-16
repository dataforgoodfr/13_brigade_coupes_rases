from logging import getLogger
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.config import settings
from app.deps import db_session
from app.models import User
from app.schemas.base import BaseSchema
from app.schemas.image_upload import ImageUploadRequest, ImageUploadResponse
from app.services.images import (
    LOCAL_UPLOAD_KEY,
    MAX_UPLOAD_SIZE_BYTES,
    is_report_photo,
    local_upload_path,
    sign_local_upload,
    verify_local_upload,
)
from app.services.s3 import s3_service, sanitize_filename
from app.services.user_auth import get_current_user, get_optional_current_user

logger = getLogger(__name__)

router = APIRouter(prefix="/api/v1/images", tags=["Images"])

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
    _: User = Depends(get_current_user),
) -> ImageUploadResponse:
    content_type = infer_content_type(
        upload_request.filename, upload_request.content_type
    )

    if content_type not in ALLOWED_TYPES:
        raise AppHTTPException(
            status_code=400,
            type="INVALID_CONTENT_TYPE",
            detail=f"Type de fichier non autorisé. Types acceptés : {ALLOWED_TYPES}",
        )

    max_size = MAX_UPLOAD_SIZE_BYTES
    if upload_request.file_size and upload_request.file_size > max_size:
        raise AppHTTPException(
            status_code=400,
            type="FILE_SIZE_EXCEEDED",
            detail=f"Fichier trop volumineux ({upload_request.file_size} octets). Taille maximale : {max_size} octets.",
        )

    if upload_request.report_id and not upload_request.report_id.isdigit():
        raise AppHTTPException(
            status_code=400, type="INVALID_REPORT_ID", detail="Identifiant invalide."
        )

    if not is_s3_configured():
        import uuid as uuid_module

        file_id = str(uuid_module.uuid4())
        filename = sanitize_filename(upload_request.filename) or "photo.jpg"
        if upload_request.report_id:
            key = f"local/reports/{upload_request.report_id}/{file_id}_{filename}"
        else:
            key = f"local/{file_id}_{filename}"

        base_url = str(request.base_url).rstrip("/")
        return ImageUploadResponse(
            upload_url=f"{base_url}/api/v1/images/local-upload",
            fields={
                "key": key,
                "Content-Type": content_type,
                **sign_local_upload(key),
            },
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


def local_storage_only() -> None:
    """Le repli local n'existe pas quand S3 est configuré (production)."""
    if is_s3_configured():
        raise HTTPException(status_code=404, detail="Not Found")


@router.post(
    "/local-upload", status_code=204, dependencies=[Depends(local_storage_only)]
)
async def local_upload(
    key: Annotated[str, Form()],
    expires: Annotated[str, Form()],
    signature: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
) -> None:
    """Repli local sans S3 : la clé, signée par `upload-url`, ne peut être ni forgée ni détournée."""
    file_path = local_upload_path(key)
    if (
        file_path is None
        or not LOCAL_UPLOAD_KEY.match(key)
        or not verify_local_upload(key, expires, signature)
    ):
        raise HTTPException(status_code=403, detail="Clé d'envoi invalide")
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux")
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(content)


@router.get("/local/{key:path}", dependencies=[Depends(local_storage_only)])
async def get_local_file(
    key: str,
    _: User | None = Depends(get_optional_current_user),
) -> FileResponse:
    """Sert les fichiers du repli local ; le chemin ne peut pas sortir du dossier d'envoi."""
    file_path = local_upload_path(key)
    if file_path is None or not file_path.is_file():
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
    db: Session = db_session,
    _: User = Depends(get_current_user),
) -> ImageViewResponse:
    if not is_report_photo(db, s3_key):
        raise AppHTTPException(
            status_code=403,
            type="NOT_A_REPORT_PHOTO",
            detail="Seules les photographies de signalement sont consultables.",
        )

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
