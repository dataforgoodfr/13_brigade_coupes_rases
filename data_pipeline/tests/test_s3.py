# test_s3.py
import os
import sys

import pytest

# Adjust path if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.utils.s3 import S3Manager


@pytest.fixture
def s3_manager(s3_mock):
    """
    Fixture that returns an instance of S3Manager with mocked S3.
    The 's3_mock' fixture sets up Moto and overrides env vars first.
    """
    return S3Manager()


def test_file_check(s3_mock, s3_manager):
    bucket_name = s3_manager.bucket_name
    test_key = "test-folder/test-file.txt"

    # Upload a test file to mock S3
    s3_mock.put_object(Bucket=bucket_name, Key=test_key, Body="Hello, S3!")

    assert s3_manager.file_check("test-folder/", "test-file.txt") is True
    assert s3_manager.file_check("test-folder/", "nonexistent.txt") is False


def test_load_file_memory(s3_mock, s3_manager):
    bucket_name = s3_manager.bucket_name
    test_key = "test-folder/test-file.txt"
    test_content = "This is a test file."

    s3_mock.put_object(Bucket=bucket_name, Key=test_key, Body=test_content)

    content = s3_manager.load_file_memory(test_key)
    assert content == test_content


def test_upload_to_s3(s3_mock, s3_manager, tmp_path):
    test_file = tmp_path / "upload-test.txt"
    test_file.write_text("Upload test content.")
    test_key = "uploads/upload-test.txt"

    s3_manager.upload_to_s3(str(test_file), test_key)

    # Verify the file exists in S3
    response = s3_mock.list_objects_v2(Bucket=s3_manager.bucket_name, Prefix=test_key)
    assert "Contents" in response


def test_download_from_s3(s3_mock, s3_manager, tmp_path):
    bucket_name = s3_manager.bucket_name
    test_key = "downloads/test-download.txt"
    test_content = "Download test content."

    s3_mock.put_object(Bucket=bucket_name, Key=test_key, Body=test_content)

    download_path = tmp_path / "downloaded.txt"
    s3_manager.download_from_s3(test_key, str(download_path))

    assert download_path.read_text() == test_content


def test_delete_from_s3(s3_mock, s3_manager):
    bucket_name = s3_manager.bucket_name
    test_key = "deletions/delete-test.txt"

    s3_mock.put_object(Bucket=bucket_name, Key=test_key, Body="Delete me!")
    assert s3_manager.file_check("deletions/", "delete-test.txt") is True

    s3_manager.delete_from_s3(test_key)
    assert s3_manager.file_check("deletions/", "delete-test.txt") is False
