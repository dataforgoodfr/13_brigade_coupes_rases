from collections.abc import Iterator
from pathlib import Path
from typing import Any

import boto3
import pytest
from botocore.exceptions import ClientError
from moto import mock_aws

from pipeline.scripts import upload_gold
from pipeline.scripts.utils import S3Manager

BUCKET = "bucket-test"
CURRENT = "data_pipeline/gold/sufosat/current/sufosat_clusters_enriched.fgb"
PREVIOUS = "data_pipeline/gold/sufosat/previous/sufosat_clusters_enriched.fgb"


@pytest.fixture
def s3(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Any]:
    """Un stockage simulé, et un dossier de données temporaire."""
    for name in ("S3_ENDPOINT", "AWS_PROFILE"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("S3_BUCKET_NAME", BUCKET)
    monkeypatch.setenv("S3_REGION", "us-east-1")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "test")
    monkeypatch.setattr(upload_gold, "DATA_DIR", tmp_path)
    (tmp_path / "sufosat").mkdir()
    (tmp_path / "sufosat" / "clusters_final.fgb").write_bytes(b"nouveau")
    with mock_aws():
        client = boto3.client("s3", region_name="us-east-1")
        client.create_bucket(Bucket=BUCKET)
        yield client


def read(client: Any, key: str) -> bytes:
    body: bytes = client.get_object(Bucket=BUCKET, Key=key)["Body"].read()
    return body


def test_new_gold_replaces_current_and_old_one_moves_to_previous(s3: Any) -> None:
    s3.put_object(Bucket=BUCKET, Key=CURRENT, Body=b"ancien")

    upload_gold.upload_gold_to_s3()

    assert read(s3, CURRENT) == b"nouveau"
    assert read(s3, PREVIOUS) == b"ancien"


def test_failed_upload_stops_the_pipeline_and_keeps_current(
    s3: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    s3.put_object(Bucket=BUCKET, Key=CURRENT, Body=b"ancien")
    upload = S3Manager.upload_to_s3

    def failing_upload(self: S3Manager, file_path: str, s3_key: str) -> None:
        if s3_key == CURRENT:
            raise ConnectionError("stockage injoignable")
        upload(self, file_path, s3_key)

    monkeypatch.setattr(S3Manager, "upload_to_s3", failing_upload)

    with pytest.raises(ConnectionError):
        upload_gold.upload_gold_to_s3()

    assert read(s3, CURRENT) == b"ancien"


def test_failed_download_raises_and_leaves_no_partial_file(
    s3: Any, tmp_path: Path
) -> None:
    target = tmp_path / "absent.fgb"

    with pytest.raises(ClientError):
        S3Manager().download_from_s3("cle/absente.fgb", str(target))

    assert not target.exists()
