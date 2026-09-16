from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.routes import images as images_routes
from app.services import images
from test.common.user import get_volunteer_user_token

IMAGES = "/api/v1/images"


@pytest.fixture
def local_storage(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Mode sans S3 : les fichiers vont dans un dossier temporaire."""
    monkeypatch.setattr(images, "LOCAL_UPLOADS_PATH", tmp_path)
    monkeypatch.setattr(images_routes, "is_s3_configured", lambda: False)
    return tmp_path


def form_fields(fields: dict[str, str]) -> dict[str, str]:
    return {k: v for k, v in fields.items() if k != "Content-Type"}


def test_upload_url_requires_authentication(client: TestClient) -> None:
    response = client.post(
        f"{IMAGES}/upload-url", json={"filename": "a.jpg", "contentType": "image/jpeg"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_upload_url_rejects_bad_type_and_size(client: TestClient, db: Session) -> None:
    _, token = get_volunteer_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        f"{IMAGES}/upload-url",
        json={"filename": "doc.pdf", "contentType": "application/pdf"},
        headers=headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"]["type"] == "INVALID_CONTENT_TYPE"

    response = client.post(
        f"{IMAGES}/upload-url",
        json={
            "filename": "big.jpg",
            "contentType": "image/jpeg",
            "fileSize": 11 * 1024 * 1024,
        },
        headers=headers,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"]["type"] == "FILE_SIZE_EXCEEDED"


def test_local_upload_round_trip(
    client: TestClient, db: Session, local_storage: Path
) -> None:
    _, token = get_volunteer_user_token(client, db)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        f"{IMAGES}/upload-url",
        json={"filename": "photo.jpg", "contentType": "image/jpeg", "reportId": "1"},
        headers=headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["key"].startswith("local/reports/1/")
    assert data["key"].endswith("_photo.jpg")
    assert data["uploadUrl"].endswith(f"{IMAGES}/local-upload")
    assert data["fields"]["key"] == data["key"]
    assert data["fields"]["Content-Type"] == "image/jpeg"
    assert {"expires", "signature"} <= set(data["fields"])

    response = client.post(
        f"{IMAGES}/local-upload",
        data=form_fields(data["fields"]),
        files={"file": ("photo.jpg", b"not really a jpeg", "image/jpeg")},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    stored = local_storage / data["key"].removeprefix("local/")
    assert stored.read_bytes() == b"not really a jpeg"

    response = client.get(f"{IMAGES}/local/{data['key']}")
    assert response.status_code == status.HTTP_200_OK
    assert response.content == b"not really a jpeg"


def test_local_file_not_found(client: TestClient, local_storage: Path) -> None:
    response = client.get(f"{IMAGES}/local/reports/1/missing.jpg")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_view_url_for_a_local_key(client: TestClient, db: Session) -> None:
    _, token = get_volunteer_user_token(client, db)

    response = client.get(
        f"{IMAGES}/view/local/reports/1/abc_photo.jpg",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["viewUrl"].endswith(
        f"{IMAGES}/local/reports/1/abc_photo.jpg"
    )
    assert client.get(f"{IMAGES}/view/local/x.jpg").status_code == 401


def test_local_routes_do_not_exist_when_s3_is_configured(client: TestClient) -> None:
    # .env.test configure S3 : le repli local n'est pas monté.
    key = "local/" + "a" * 36 + "_x.jpg"
    upload = client.post(
        f"{IMAGES}/local-upload",
        data={"key": key, **images.sign_local_upload(key)},
        files={"file": ("x.jpg", b"x", "image/jpeg")},
    )
    assert upload.status_code == status.HTTP_404_NOT_FOUND
    assert client.get(f"{IMAGES}/local/{key}").status_code == 404


def test_local_upload_requires_the_signed_key(
    client: TestClient, db: Session, local_storage: Path
) -> None:
    _, token = get_volunteer_user_token(client, db)
    fields = client.post(
        f"{IMAGES}/upload-url",
        json={"filename": "photo.jpg", "contentType": "image/jpeg", "reportId": "1"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()["fields"]
    forged_key = "local/reports/1/" + "a" * 36 + "_evil.jpg"

    for bad in (
        {**fields, "signature": "0" * 64},
        {**fields, "key": forged_key},
        {**fields, "expires": "1"},
    ):
        response = client.post(
            f"{IMAGES}/local-upload",
            data=form_fields(bad),
            files={"file": ("photo.jpg", b"jpeg-bytes", "image/jpeg")},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    assert list(local_storage.rglob("*.jpg")) == []


def test_local_upload_cannot_escape_the_uploads_folder(
    client: TestClient, local_storage: Path
) -> None:
    key = "local/../" + "a" * 36 + "_outside.jpg"

    response = client.post(
        f"{IMAGES}/local-upload",
        data={"key": key, **images.sign_local_upload(key)},
        files={"file": ("photo.jpg", b"x", "image/jpeg")},
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert not (local_storage.parent / ("a" * 36 + "_outside.jpg")).exists()


def test_local_upload_refuses_oversized_files(
    client: TestClient, local_storage: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(images_routes, "MAX_UPLOAD_SIZE_BYTES", 10)
    key = "local/" + "a" * 36 + "_big.jpg"

    response = client.post(
        f"{IMAGES}/local-upload",
        data={"key": key, **images.sign_local_upload(key)},
        files={"file": ("big.jpg", b"x" * 11, "image/jpeg")},
    )

    assert response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    assert list(local_storage.rglob("*.jpg")) == []


def test_local_read_cannot_escape_the_uploads_folder(
    client: TestClient, local_storage: Path
) -> None:
    (local_storage.parent / "secret.txt").write_text("secret")

    assert client.get(f"{IMAGES}/local/../secret.txt").status_code == 404
    assert client.get(f"{IMAGES}/local/%2e%2e/secret.txt").status_code == 404


def test_upload_url_sanitizes_the_filename(
    client: TestClient, db: Session, local_storage: Path
) -> None:
    _, token = get_volunteer_user_token(client, db)

    response = client.post(
        f"{IMAGES}/upload-url",
        json={
            "filename": "../my photo (1).jpg",
            "contentType": "image/jpeg",
            "reportId": "x",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"]["type"] == "INVALID_REPORT_ID"

    response = client.post(
        f"{IMAGES}/upload-url",
        json={
            "filename": "../my photo (1).jpg",
            "contentType": "image/jpeg",
            "reportId": "1",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["key"].endswith("_.._my_photo_1_.jpg")
    assert images.LOCAL_UPLOAD_KEY.match(data["key"])

    # Un nom qui ne contient que des caractères interdits reçoit un nom par défaut.
    response = client.post(
        f"{IMAGES}/upload-url",
        json={"filename": "???", "contentType": "image/jpeg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.json()["key"].endswith("_photo.jpg")

    # Les ".." d'un nom de fichier ne sont pas une traversée : l'envoi passe.
    response = client.post(
        f"{IMAGES}/local-upload",
        data=form_fields(data["fields"]),
        files={"file": ("photo.jpg", b"x", "image/jpeg")},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    [written] = local_storage.rglob("*.jpg")
    assert written.is_relative_to(local_storage / "reports" / "1")
