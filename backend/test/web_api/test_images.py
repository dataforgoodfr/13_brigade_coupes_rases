from pathlib import Path

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.routes import images
from test.common.user import get_volunteer_user_token

IMAGES = "/api/v1/images"


@pytest.fixture
def local_storage(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Mode sans S3 : les fichiers vont dans un dossier temporaire."""
    monkeypatch.setattr(images, "LOCAL_UPLOADS_PATH", tmp_path)
    monkeypatch.setattr(images, "is_s3_configured", lambda: False)
    return tmp_path


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
    assert data["fields"] == {"key": data["key"], "Content-Type": "image/jpeg"}

    response = client.post(
        f"{IMAGES}/local-upload",
        data={"key": data["key"]},
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
