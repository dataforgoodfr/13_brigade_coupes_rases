import pytest
import boto3
import os
from moto import mock_aws
from dotenv import load_dotenv


@pytest.fixture(scope="function")
def s3_mock(monkeypatch):
    """
    Pytest fixture to mock AWS S3 using moto.
    Creates a mock S3 bucket for testing and overrides env vars so we don't
    accidentally call real S3.
    """
    monkeypatch.setenv("S3_REGION", "us-east-1")
    monkeypatch.setenv("S3_ENDPOINT", "")  # Force empty, so it doesn't call real endpoint
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.setenv("S3_BUCKET_NAME", "test-bucket")

    load_dotenv()  # Still loads .env, but we override with monkeypatch

    with mock_aws():
        # Create a fake S3 client
        s3 = boto3.client("s3", region_name="us-east-1")

        # Create the test bucket
        bucket_name = os.getenv("S3_BUCKET_NAME", "test-bucket")
        s3.create_bucket(Bucket=bucket_name)

        yield s3  # Provide the mocked S3 client to tests
