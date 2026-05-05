import logging
import os
import time
from datetime import datetime, UTC
from pathlib import Path

import ee
import requests
from google.cloud import storage

from pipeline.scripts import DATA_DIR
from pipeline.scripts.utils import S3Manager

LOCAL_PREFIX = "data_pipeline/bronze/sufosat/"
RADD_EUROPE_RESOURCE = "projects/wurnrt-raddeurope/assets/01_NRT/00_Operational/V1_IC"
FRANCE_LEVEL0_RESOURCE = "FAO/GAUL/2015/level0"
EXPORT_CRS = "EPSG:3035"
EXPORT_SCALE_METERS = 10
EE_EXPORT_TIMEOUT_SECONDS = 7200
EE_EXPORT_POLL_SECONDS = 20


def initialize_earth_engine() -> None:
    try:
        ee.Initialize()
    except Exception as exc:
        raise RuntimeError(
            "Earth Engine authentication is required. Run ee.Authenticate() once, then rerun."
        ) from exc


def get_latest_radd_alert_metadata() -> dict:
    latest_alert = ee.Image(
        ee.ImageCollection(RADD_EUROPE_RESOURCE)
        .filterMetadata("layer", "contains", "alert")
        .sort("system:time_end", False)
        .first()
    )
    props = latest_alert.toDictionary(["system:index", "system:time_end"]).getInfo()
    if not props or "system:index" not in props:
        raise RuntimeError("Could not resolve latest RADD alert from Earth Engine.")

    image_index = str(props["system:index"])
    date_token = image_index.split("_")[-1]
    try:
        version = int(date_token)
    except ValueError:
        dt = datetime.fromtimestamp(int(props["system:time_end"]) / 1000, tz=UTC)
        version = int(dt.strftime("%Y%m%d"))

    return {
        "image": latest_alert,
        "version": version,
        "filename_key": f"radd_france_alert_date_{version}.tif",
    }


def local_sufosat_version() -> dict | None:
    s3_manager = S3Manager()
    all_files = s3_manager.list_bucket_contents() or []
    bronze_files = [e for e in all_files if e.startswith(LOCAL_PREFIX)]
    if not bronze_files:
        return None
    latest_id = str(max(int(e.split("/")[3]) for e in bronze_files))
    for e in bronze_files:
        if e.split("/")[3] == latest_id:
            return {"version": int(latest_id), "filename_key": e.split("/")[4]}
    return None


def get_france_aoi() -> ee.Geometry:
    return ee.FeatureCollection(FRANCE_LEVEL0_RESOURCE).filter(
        ee.Filter.eq("ADM0_NAME", "France")
    ).geometry()


def build_masked_date_image(latest_alert: ee.Image) -> ee.Image:
    alert_mask = latest_alert.select("Alert").gte(2)
    return latest_alert.select("Date").updateMask(alert_mask).rename("sufosat_date")


def download_ee_image_to_tiff(image: ee.Image, region: ee.Geometry, output_path: Path) -> None:
    simplified_region = region.simplify(100).getInfo()["coordinates"]
    download_url = image.toInt16().getDownloadURL(
        {
            "scale": EXPORT_SCALE_METERS,
            "crs": EXPORT_CRS,
            "region": simplified_region,
            "format": "GEO_TIFF",
        }
    )

    response = requests.get(download_url, timeout=300)
    response.raise_for_status()
    output_path.write_bytes(response.content)


def gcs_blob_exists(bucket_name: str, blob_name: str) -> bool:
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    return bucket.blob(blob_name).exists(client)


def export_ee_image_to_gcs(
    image: ee.Image, region: ee.Geometry, bucket_name: str, blob_name: str, description: str
) -> None:
    task = ee.batch.Export.image.toCloudStorage(
        image=image.toInt16(),
        description=description,
        bucket=bucket_name,
        fileNamePrefix=blob_name.removesuffix(".tif"),
        region=region,
        scale=EXPORT_SCALE_METERS,
        crs=EXPORT_CRS,
        maxPixels=1e13,
        fileFormat="GeoTIFF",
        formatOptions={"cloudOptimized": True},
    )
    task.start()

    start = time.time()
    while task.active():
        elapsed = int(time.time() - start)
        if elapsed > EE_EXPORT_TIMEOUT_SECONDS:
            task.cancel()
            raise TimeoutError(
                f"Earth Engine export task timed out after {EE_EXPORT_TIMEOUT_SECONDS} seconds."
            )
        logging.info("Waiting for Earth Engine export task to finish...")
        time.sleep(EE_EXPORT_POLL_SECONDS)

    status = task.status()
    state = status.get("state")
    if state != "COMPLETED":
        raise RuntimeError(f"Earth Engine export failed: {status}")


def download_gcs_blob_to_local(bucket_name: str, blob_name: str, output_path: Path) -> None:
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    if not blob.exists(client):
        raise RuntimeError(f"Exported GCS blob not found: gs://{bucket_name}/{blob_name}")
    blob.download_to_filename(str(output_path))


def get_gcs_export_target(filename: str) -> tuple[str, str] | None:
    bucket_name = os.getenv("GCS_RADD_EXPORT_BUCKET", "").strip()
    if not bucket_name:
        return None
    prefix = os.getenv("GCS_RADD_EXPORT_PREFIX", "radd_exports").strip("/")
    blob_name = f"{prefix}/{filename}" if prefix else filename
    return bucket_name, blob_name


def get_sufosat_tiff() -> Path:
    """
    Ensures the latest RADD Date raster for France is available locally.

    Data source:
    - Earth Engine collection: projects/wurnrt-raddeurope/assets/01_NRT/00_Operational/V1_IC
    - Image selection: latest "alert" layer
    - Export: Date band masked by Alert >= 2

    S3 options:
    - Current implementation: download locally then upload to S3 bronze.
    - Alternative (recommended at scale): Earth Engine export to Google Cloud Storage, then
      transfer GCS -> S3 via Storage Transfer Service, rclone, or gsutil + aws cli.
    """
    initialize_earth_engine()
    s3_manager = S3Manager()
    radd_metadata = get_latest_radd_alert_metadata()
    local_version = local_sufosat_version()

    BASE_DIR = DATA_DIR / "sufosat"
    BASE_DIR.mkdir(parents=True, exist_ok=True)

    local_path = BASE_DIR / radd_metadata["filename_key"]
    s3_key = f"{LOCAL_PREFIX}{radd_metadata['version']}/{radd_metadata['filename_key']}"

    if local_version is None or radd_metadata["version"] != local_version["version"]:
        logging.info(
            f"New RADD version detected ({radd_metadata['version']}). Exporting from Earth Engine..."
        )
        france_aoi = get_france_aoi()
        masked_date_image = build_masked_date_image(radd_metadata["image"])
        gcs_target = get_gcs_export_target(radd_metadata["filename_key"])
        if gcs_target is None:
            logging.info(
                "GCS_RADD_EXPORT_BUCKET is not set; falling back to direct Earth Engine download."
            )
            download_ee_image_to_tiff(masked_date_image, france_aoi, local_path)
        else:
            bucket_name, blob_name = gcs_target
            try:
                if not gcs_blob_exists(bucket_name, blob_name):
                    export_ee_image_to_gcs(
                        image=masked_date_image,
                        region=france_aoi,
                        bucket_name=bucket_name,
                        blob_name=blob_name,
                        description=f"radd_france_alert_export_{radd_metadata['version']}",
                    )
                else:
                    logging.info(f"Reusing existing GCS export: gs://{bucket_name}/{blob_name}")
                download_gcs_blob_to_local(bucket_name, blob_name, local_path)
            except Exception as exc:
                logging.warning(
                    "GCS export/download failed (%s). Falling back to direct Earth Engine download.",
                    exc,
                )
                download_ee_image_to_tiff(masked_date_image, france_aoi, local_path)
        s3_manager.upload_to_s3(str(local_path), s3_key)
    else:
        logging.info(f"RADD version {radd_metadata['version']} already in S3 bronze.")
        if not local_path.exists():
            logging.info("Downloading tiff from S3 bronze to local...")
            s3_manager.download_from_s3(s3_key, str(local_path))
        else:
            logging.info("Tiff already available locally.")

    return local_path
