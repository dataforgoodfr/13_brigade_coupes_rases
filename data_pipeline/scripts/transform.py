import os
import rasterio
from rasterio.features import shapes
import numpy as np
import pandas as pd
import geopandas as gpd
import fiona

from utils.s3 import S3Manager
from utils.logging import etl_logger
from utils.date_parser import parse_yyddd

# Configuration
s3_manager = S3Manager()
logger = etl_logger("logs/transform.log")


# Récupération du fichier S3
def load_from_S3(s3_prefix, zendo_filename, download_path):
    try:
        s3_manager.download_from_s3(
            s3_key=s3_prefix + zendo_filename, download_path=download_path + zendo_filename
        )

        logger.info("✅ Fichier téléchargé depuis S3")
    except Exception as e:
        logger.error(f"❌ Erreur lors du téléchargement du fichier depuis S3: {e}")


def filter_raster_by_date(input_tif_filepath, output_tif_filepath):
    """
    Process a large raster file with efficient memory usage by working with small blocks
    instead of loading the entire raster into memory at once.
    """
    with rasterio.open(input_tif_filepath) as src:
        # Preserve original metadata
        profile = src.profile.copy()
        
        # Create output file with same profile
        with rasterio.open(output_tif_filepath, "w", **profile) as dst:
            # Get the optimal window size for reading blocks
            # This uses rasterio's built-in windowing to avoid loading the whole dataset
            windows = list(src.block_windows())
            total_windows = len(windows)
            
            # Process each window/block separately
            for idx, (window_idx, window) in enumerate(windows):
                if idx % 100 == 0:
                    logger.info(f"Processing block {idx+1}/{total_windows}")
                
                # Read only the current window data
                data = src.read(1, window=window)
                
                # Apply filter on this window
                mask = (data >= 24001) & (data <= 24366)
                filtered_data = np.where(mask, data, 0)
                
                # Write processed window to output
                dst.write(filtered_data, 1, window=window)
    
    logger.info("✅ Fichier tif regroupé")

def polygonize_tif(raster_path, vector_path):
    """
    Polygonize a large GeoTIFF using a chunked approach to manage memory usage.
    """
    os.makedirs(os.path.dirname(vector_path), exist_ok=True)
    
    # Define Fiona schema
    schema = {"geometry": "Polygon", "properties": {"DN": "int"}}
    
    # Open raster to get metadata
    with rasterio.open(raster_path) as src:
        logger.info("✅ Raster opened with Rasterio")
        crs = src.crs
        transform = src.transform
        
        # Create output shapefile
        if os.path.exists(vector_path):
            os.remove(vector_path)
            
        with fiona.open(
            vector_path,
            "w",
            driver="ESRI Shapefile",
            schema=schema,
            crs=crs.to_dict(),
        ) as shp:
            # Process in chunks using block windows
            windows = list(src.block_windows())
            total_windows = len(windows)
            
            for idx, (window_idx, window) in enumerate(windows):
                if idx % 10 == 0:
                    logger.info(f"Polygonizing block {idx+1}/{total_windows}")
                
                # Read only the data for this window
                band = src.read(1, window=window)
                
                # Skip window if it's all zeros
                if not np.any(band):
                    continue
                
                # Create a window-specific transform
                window_transform = rasterio.windows.transform(window, transform)
                mask = band != 0
                
                # Polygonize this window
                window_polygons = (
                    {"properties": {"DN": int(value)}, "geometry": geom}
                    for geom, value in shapes(band, mask=mask, transform=window_transform)
                )
                
                # Write window polygons to shapefile
                for feature in window_polygons:
                    shp.write(feature)
    
    logger.info("✅ Shapefile created")
    logger.info("✅ Polygonization successful")


def read_shape(vector_path):
    sufosat: gpd.GeoDataFrame = gpd.read_file(vector_path)
    clear_cut = sufosat

    return clear_cut


def read_parquet(parquet_file):
    parquet = pd.read_parquet(parquet_file)

    return parquet


def read_geoparquet(geoparquet_file):
    geoparquet = gpd.read_parquet(geoparquet_file)

    return geoparquet


def compute_date(clear_cut):
    clear_cut["date"] = parse_yyddd(clear_cut["DN"])
    clear_cut.drop(["DN"], axis=1, inplace=True)
    logger.info(f"✅ Calcul des dates - {clear_cut.date.dtype}")

    return clear_cut


def reprojection_n_buffer(clear_cut):
    # Reprojection et buffer
    clear_cut = clear_cut.to_crs(epsg=2154)
    logger.info("✅ Reprojection géographique")
    MAX_METERS_BETWEEN_CLEAR_CUTS = 50
    clear_cut["buffered"] = clear_cut.geometry.buffer(MAX_METERS_BETWEEN_CLEAR_CUTS / 2)
    logger.info("✅ Buffer du polygone")

    return clear_cut


def sjoin_data(clear_cut):
    clear_cut_buffered = clear_cut.set_geometry("buffered").drop(columns="geometry")
    clear_cut_cluster: gpd.GeoDataFrame = clear_cut_buffered.sjoin(
        clear_cut_buffered, predicate="intersects"
    ).drop(columns="buffered")
    clear_cut_cluster: gpd.GeoDataFrame = clear_cut_cluster.reset_index().rename(
        columns={"index": "index_left"}
    )
    logger.info("✅ Spatial join")

    return clear_cut_cluster


def clean_cluster(clear_cut_cluster):
    clear_cut_cluster = clear_cut_cluster[
        clear_cut_cluster["index_left"] != clear_cut_cluster["index_right"]
    ]
    clear_cut_cluster = clear_cut_cluster[
        clear_cut_cluster["index_left"] < clear_cut_cluster["index_right"]
    ]
    MAX_DAYS_BETWEEN_CLEAR_CUTS = 7 * 4

    clear_cut_cluster["date_left"] = pd.to_datetime(clear_cut_cluster["date_left"])
    clear_cut_cluster["date_right"] = pd.to_datetime(clear_cut_cluster["date_right"])

    clear_cut_cluster = clear_cut_cluster[
        (clear_cut_cluster["date_left"] - clear_cut_cluster["date_right"]).dt.days.abs()
        <= MAX_DAYS_BETWEEN_CLEAR_CUTS
    ]
    logger.info("✅ Cleaned cluster")

    return clear_cut_cluster


def group_clear_cuts(clear_cut_cluster, clear_cuts_disjoint_set, clear_cut):
    for index_left, index_right in clear_cut_cluster[["index_left", "index_right"]].itertuples(
        index=False
    ):
        clear_cuts_disjoint_set.merge(index_left, index_right)

    logger.info("✅ Then we group the clear cuts that belong together one pair at a time")

    subsets = clear_cuts_disjoint_set.subsets()
    for i, subset in enumerate(subsets):
        clear_cut.loc[list(subset), "clear_cut_group"] = i
    clear_cut = clear_cut.drop(columns="buffered")
    clear_cut["clear_cut_group"] = clear_cut["clear_cut_group"].astype(int)

    clear_cut_group = clear_cut.dissolve(
        by="clear_cut_group", aggfunc={"date": ["min", "max"]}
    ).rename(
        columns={
            ("date", "min"): "date_min",
            ("date", "max"): "date_max",
        }
    )
    clear_cut_group["date_min"] = pd.to_datetime(clear_cut_group["date_min"])
    clear_cut_group["date_max"] = pd.to_datetime(clear_cut_group["date_max"])

    clear_cut_group["days_delta"] = (
        clear_cut_group["date_max"] - clear_cut_group["date_min"]
    ).dt.days
    clear_cut_group["clear_cut_group_size"] = clear_cut.groupby("clear_cut_group").size()
    logger.info("✅ clear_cut_group")

    return clear_cut_group


def clear_cut_area(clear_cut_group):
    clear_cut_group["geometry"] = clear_cut_group["geometry"].buffer(0.0001)
    clear_cut_group["area_ha"] = clear_cut_group.area / 10000
    clear_cut_group = clear_cut_group[clear_cut_group["area_ha"] >= 0.5].copy()
    logger.info("✅ clear_cut area")

    return clear_cut_group


def compute_concave(clear_cut_group):
    clear_cut_group["concave_hull_score"] = (
        clear_cut_group.area / clear_cut_group.concave_hull(0.42).area
    )
    clear_cut_group = clear_cut_group[clear_cut_group["concave_hull_score"] >= 0.42]
    logger.info("✅ Filter clear_cuts by concave_hull_score")

    return clear_cut_group


def export_data(clear_cut_group, filepath, filename):
    clear_cut_group.to_parquet(filepath + filename, engine="pyarrow")
    logger.info("✅ exported")
