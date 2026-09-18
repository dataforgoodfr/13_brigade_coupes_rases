import json
import logging
import os
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import TypedDict, cast

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
# 40 km × 40 km à 10 m en int16 → 32 Mo, sous le plafond (~48 Mo) de getDownloadURL
DOWNLOAD_TILE_SIZE_METERS = 40_000
DOWNLOAD_ATTEMPTS = 3


class RaddVersion(TypedDict):
    version: int
    filename_key: str


class RaddAlert(RaddVersion):
    image: ee.Image


def initialize_earth_engine() -> None:
    """Initialise Earth Engine : compte de service (sans navigateur) ou OAuth.

    Sans navigateur (CI, tâche planifiée) : GOOGLE_SERVICE_ACCOUNT_KEY contient
    le JSON de la clé d'un compte de service GCP enregistré auprès d'Earth
    Engine (https://signup.earthengine.google.com/#!/service_accounts).

    En local : lancer une fois ``earthengine authenticate``.
    """
    project = os.environ.get("EARTH_ENGINE_PROJECT") or os.environ.get(
        "GOOGLE_CLOUD_PROJECT"
    )
    sa_key_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_KEY")

    if sa_key_json:
        logging.info("Initializing Earth Engine with service account credentials")
        try:
            key_data = json.loads(sa_key_json)
            credentials = ee.ServiceAccountCredentials(
                key_data["client_email"], key_data=sa_key_json
            )
            ee.Initialize(credentials=credentials, project=project)
            return
        except Exception as exc:
            raise RuntimeError(
                "Earth Engine service account initialization failed. "
                "Check that GOOGLE_SERVICE_ACCOUNT_KEY contains valid JSON and that "
                "the service account is registered with Earth Engine at "
                "https://signup.earthengine.google.com/#!/service_accounts"
            ) from exc

    logging.info("Initializing Earth Engine with OAuth credentials")
    cloud_api_key = (
        os.environ.get("EARTH_ENGINE_CLOUD_API_KEY")
        or os.environ.get("EARTH_ENGINE_API_KEY")
        or os.environ.get("GOOGLE_CLOUD_API_KEY")
    )
    init_kwargs: dict[str, str] = {}
    if project:
        init_kwargs["project"] = project
    if cloud_api_key:
        init_kwargs["cloud_api_key"] = cloud_api_key
    try:
        ee.Initialize(**init_kwargs)
    except Exception as exc:
        raise RuntimeError(
            "Earth Engine failed to initialize. "
            "For headless/VM use: set GOOGLE_SERVICE_ACCOUNT_KEY env var to the JSON "
            "contents of a GCP service account key. "
            "For interactive use: run `earthengine authenticate` and set "
            "EARTH_ENGINE_PROJECT to a GCP project with the Earth Engine API enabled. "
            "See https://developers.google.com/earth-engine/guides/auth"
        ) from exc


def get_latest_radd_alert_metadata() -> RaddAlert:
    latest_alert = ee.Image(
        ee.ImageCollection(RADD_EUROPE_RESOURCE)
        .filterMetadata("layer", "contains", "alert")
        .sort("system:time_end", False)
        .first()
    )
    props = latest_alert.toDictionary(["system:index", "system:time_end"]).getInfo()
    if not props or "system:index" not in props:
        raise RuntimeError("Could not resolve latest RADD alert from Earth Engine.")

    # L'index vaut par exemple « europe_20260907 » ; à défaut, la date de fin
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


def local_sufosat_version() -> RaddVersion | None:
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
    france = ee.FeatureCollection(FRANCE_LEVEL0_RESOURCE).filter(
        ee.Filter.eq("ADM0_NAME", "France")
    )
    return cast(ee.Geometry, france.geometry())


def build_masked_date_image(latest_alert: ee.Image) -> ee.Image:
    """Bande Date des alertes confirmées (Alert >= 2), les autres pixels masqués."""
    alert_mask = latest_alert.select("Alert").gte(2)
    return cast(
        ee.Image,
        latest_alert.select("Date").updateMask(alert_mask).rename("sufosat_date"),
    )


def tile_grid(
    bounds: tuple[float, float, float, float], tile_size_m: float
) -> list[tuple[float, float, float, float]]:
    """Grille régulière de tuiles (minx, miny, maxx, maxy) couvrant `bounds`."""
    minx, miny, maxx, maxy = bounds
    tiles = []
    y = miny
    while y < maxy:
        x = minx
        while x < maxx:
            tiles.append((x, y, min(x + tile_size_m, maxx), min(y + tile_size_m, maxy)))
            x += tile_size_m
        y += tile_size_m
    return tiles


def merge_tiles(tile_paths: list[Path], output_path: Path) -> None:
    """Assemble les tuiles téléchargées en un seul GeoTIFF compressé."""
    import rasterio
    from rasterio.merge import merge

    datasets = [rasterio.open(p) for p in tile_paths]
    try:
        mosaic, transform = merge(datasets, nodata=0)
        profile = datasets[0].profile.copy()
        profile.update(
            height=mosaic.shape[1],
            width=mosaic.shape[2],
            transform=transform,
            nodata=0,
            compress="deflate",
            tiled=True,
            blockxsize=256,
            blockysize=256,
        )
        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(mosaic)
    finally:
        for dataset in datasets:
            dataset.close()


def download_ee_image_to_tiff(
    image: ee.Image, region: ee.Geometry, output_path: Path
) -> None:
    """Télécharge un raster par `getDownloadURL`, tuile par tuile.

    Une requête est plafonnée à ~50 Mo de pixels, bien en dessous de la France
    à 10 m (~11 Go). La zone est découpée en carrés de DOWNLOAD_TILE_SIZE_METERS
    dans la projection d'export, chacun sous le plafond, puis assemblée en
    local. Lent (des centaines de requêtes) mais sans bucket Cloud Storage ;
    GCS_RADD_EXPORT_BUCKET active la voie rapide.
    """
    from pyproj import Transformer
    from shapely.geometry import box, shape
    from shapely.ops import transform as shapely_transform

    region_geojson = region.simplify(100).getInfo()
    if region_geojson is None:
        raise RuntimeError("Could not fetch the export region from Earth Engine.")
    region_wgs84 = shape(region_geojson)
    to_export_crs = Transformer.from_crs(
        "EPSG:4326", EXPORT_CRS, always_xy=True
    ).transform
    region_projected = shapely_transform(to_export_crs, region_wgs84)

    tiles = [
        tile
        for tile in tile_grid(region_projected.bounds, DOWNLOAD_TILE_SIZE_METERS)
        if box(*tile).intersects(region_projected)
    ]
    logging.info(
        "Downloading %s tiles of %s m from Earth Engine",
        len(tiles),
        DOWNLOAD_TILE_SIZE_METERS,
    )

    tiles_dir = output_path.parent / f"{output_path.stem}_tiles"
    tiles_dir.mkdir(parents=True, exist_ok=True)
    tile_paths = []
    for index, (minx, miny, maxx, maxy) in enumerate(tiles, start=1):
        tile_path = tiles_dir / f"tile_{index:04d}.tif"
        tile_paths.append(tile_path)
        if tile_path.exists():
            continue  # reprise d'un téléchargement interrompu
        tile_region = ee.Geometry.Rectangle([minx, miny, maxx, maxy], EXPORT_CRS, False)
        download_url = (
            image.toInt16()
            .unmask(0)
            .getDownloadURL(
                {
                    "scale": EXPORT_SCALE_METERS,
                    "crs": EXPORT_CRS,
                    "region": tile_region,
                    "format": "GEO_TIFF",
                }
            )
        )
        for attempt in range(1, DOWNLOAD_ATTEMPTS + 1):
            try:
                response = requests.get(download_url, timeout=600)
                response.raise_for_status()
                tile_path.write_bytes(response.content)
                break
            except requests.RequestException as exc:
                if attempt == DOWNLOAD_ATTEMPTS:
                    raise
                logging.warning("Tile %s attempt %s failed: %s", index, attempt, exc)
                time.sleep(10 * attempt)
        if index % 25 == 0:
            logging.info("%s/%s tiles downloaded", index, len(tiles))

    merge_tiles(tile_paths, output_path)
    for tile_path in tile_paths:
        tile_path.unlink()
    tiles_dir.rmdir()


def gcs_blob_exists(bucket_name: str, blob_name: str) -> bool:
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    return bool(bucket.blob(blob_name).exists(client))


def export_ee_image_to_gcs(
    image: ee.Image,
    region: ee.Geometry,
    bucket_name: str,
    blob_name: str,
    description: str,
) -> None:
    task = ee.batch.Export.image.toCloudStorage(
        image=image.toInt16(),
        description=description,
        bucket=bucket_name,
        fileNamePrefix=blob_name.removesuffix(".tif"),
        region=region,
        scale=EXPORT_SCALE_METERS,
        crs=EXPORT_CRS,
        maxPixels=10**13,
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


def download_gcs_blob_to_local(
    bucket_name: str, blob_name: str, output_path: Path
) -> None:
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    if not blob.exists(client):
        raise RuntimeError(
            f"Exported GCS blob not found: gs://{bucket_name}/{blob_name}"
        )
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
    Garantit que le dernier raster RADD des dates de coupe pour la France est
    disponible en local, et le retourne.

    Source :
    - collection Earth Engine projects/wurnrt-raddeurope/assets/01_NRT/00_Operational/V1_IC
    - dernière image de la couche « alert »
    - export de la bande Date masquée par Alert >= 2

    - Si Earth Engine a une version plus récente que S3 bronze : export
      (via GCS si GCS_RADD_EXPORT_BUCKET est défini, sinon tuile par tuile),
      puis envoi vers S3 bronze.
    - Sinon : téléchargement depuis S3 bronze si le fichier n'est pas déjà là.
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
                    logging.info(
                        f"Reusing existing GCS export: gs://{bucket_name}/{blob_name}"
                    )
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
