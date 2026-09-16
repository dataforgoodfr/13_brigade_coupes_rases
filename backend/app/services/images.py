"""Repli local du stockage des photographies, utilisé sans S3 (développement)."""

import hashlib
import hmac
import re
import time
from pathlib import Path

from app.config import settings

LOCAL_UPLOADS_PATH = Path("/app/uploads")

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

# Clé produite par `generate_upload_url` : local/reports/<id>/<uuid>_<nom>
LOCAL_UPLOAD_KEY = re.compile(r"^local/(?:reports/\d+/)?[0-9a-f-]{36}_[\w.-]+$")


def local_upload_path(key: str) -> Path | None:
    """Chemin sur disque d'une clé locale, ou None si elle sort du dossier d'envoi."""
    path = (LOCAL_UPLOADS_PATH / key.removeprefix("local/")).resolve()
    if not path.is_relative_to(LOCAL_UPLOADS_PATH.resolve()):
        return None
    return path


def sign_local_upload(key: str, expires_in: int = 3600) -> dict[str, str]:
    """Équivalent minimal d'un POST présigné S3 : sans signature, pas d'écriture."""
    expires = str(int(time.time()) + expires_in)
    return {"expires": expires, "signature": _signature(key, expires)}


def verify_local_upload(key: str, expires: str, signature: str) -> bool:
    if not expires.isdigit() or int(expires) < time.time():
        return False
    return hmac.compare_digest(_signature(key, expires), signature)


def _signature(key: str, expires: str) -> str:
    return hmac.new(
        settings.JWT_SECRET_KEY.encode(), f"{key}:{expires}".encode(), hashlib.sha256
    ).hexdigest()
