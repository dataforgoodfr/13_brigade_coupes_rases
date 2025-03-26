import os
import fiona
import rasterio
import numpy as np
import pandas as pd
import geopandas as gpd
from utils.s3 import S3Manager
from rasterio.features import shapes
from utils.logging import etl_logger
from utils.date_parser import parse_yyddd
from utils.disjoin_set import DisjointSet
from tqdm import tqdm

# Configuration
s3_manager = S3Manager()
logger = etl_logger("logs/transform.log")


def load_from_S3(s3_prefix, zendo_filename, download_path):
    """
    Load the raster image from S3.

    This function downloads the raster data from an S3 bucket.

    Parameters
    ----------
    s3_prefix : str
        The prefix path in the S3 bucket.
    zendo_filename : str
        The name of the file to be downloaded.
    download_path : str
        The local path where the file will be saved.

    Returns
    -------
    None
    The function downloads the file to the specified local path.
    """
    try:
        s3_manager.download_from_s3(
            s3_key=s3_prefix + zendo_filename, download_path=download_path + zendo_filename
        )

        logger.info("✅ File downloaded from S3")
    except Exception as e:
        logger.error(f"❌ Error while downloading the file from S3: {e}")


def filter_raster_by_date(
    input_tif_filepath, 
    output_tif_filepath,
    start_date,
    end_date):
    """
    Filters a raster image by date range.

    This function reads a raster file, filters its pixel values to retain only those
    within a specified date range, and writes the filtered data to a new raster file.

    Parameters
    ----------
    input_tif_filepath : str
        Path to the input raster file.
    output_tif_filepath : str
        Path to the output raster file where the filtered data will be saved.
    start_date : int
        The minimum date value (inclusive) for filtering pixel values.
    end_date : int
        The maximum date value (inclusive) for filtering pixel values.

    Returns
    -------
    None
        The function saves the filtered raster to the specified output file.
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
            for idx, (window_idx, window) in enumerate(tqdm(windows, desc="Processing blocks", unit="block")):

                # Read only the current window data
                data = src.read(1, window=window)

                # Apply filter on this window
                mask = (data >= start_date) & (data <= end_date)
                filtered_data = np.where(mask, data, 0)

                # Write processed window to output
                dst.write(filtered_data, 1, window=window)

    logger.info("✅ Raster data filtered by date range")


def polygonize_tif(raster_path, vector_path):
    """
    Polygonize a large GeoTIFF using a chunked approach to manage memory usage.

    This function converts raster data from a GeoTIFF file into vector polygons
    and saves the output as a shapefile. It processes the raster in chunks to
    handle large files efficiently.

    Parameters
    ----------
    raster_path : str
        Path to the input GeoTIFF file.
    vector_path : str
        Path to the output shapefile where the vectorized polygons will be saved.

    Returns
    -------
    None
    The function saves the vectorized polygons to the specified shapefile.
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

            for idx, (window_idx, window) in enumerate(tqdm(windows, desc="Polygonizing blocks", unit="block")):
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


def parse_sufosat_date(sufosat_date: float) -> pd.Timestamp:
    """
    Converts SUFOSAT date format to a pandas Timestamp.

    The input format is YYDDD, where YY is the year (e.g., 18-25 = 2018-2025)
    and DDD is the day of the year (1-366).

    Parameters
    ----------
    sufosat_date : float
        Date in SUFOSAT format (YYDDD).

    Returns
    -------
    pd.Timestamp
        Converted date as a pandas Timestamp.

    Examples
    --------
    >>> parse_sufosat_date(19032)
    Timestamp('2019-02-01 00:00:00')  # February 1, 2019 (32nd day of 2019)
    """
    sufosat_date = int(sufosat_date)
    return pd.Timestamp(year=2000 + sufosat_date // 1000, month=1, day=1) + pd.Timedelta(
        days=(sufosat_date % 1000) - 1
    )


def pair_clear_cuts_through_space_and_time(
    gdf: gpd.GeoDataFrame, 
    max_meters_between_clear_cuts: int, 
    max_days_between_clear_cuts: int) -> pd.DataFrame:
    """
    Identifies pairs of clear-cuts that are within a specified distance and a
    specified number of days of each other.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons with a 'geometry' column.
    max_meters_between_clear_cuts : int
        Maximum distance in meters that can separate two clear-cuts for them
        to be considered a pair.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them related.


    Returns
    -------
    pd.DataFrame
        DataFrame with columns:
        - index_left: Index of the first clear-cut in each pair
        - date_left: Date of the first clear-cut
        - index_right: Index of the second clear-cut in each pair
        - date_right: Date of the second clear-cut

    Notes
    -----
    This function can consume a significant amount of memory due to the Cartesian product
    generated by the spatial join.
    """
    logger.info(
        f"Pairing clear-cuts within {max_meters_between_clear_cuts} meters "
        f"and {max_days_between_clear_cuts} days of each other"
    )

    # Cluster the clear-cuts that are within `max_meters_between_clear_cuts` of each other
    # Lambert-93 CRS uses meters as its unit of measurement for distance.
    clear_cut_pairs = (
        gdf.sjoin(gdf, how="left", predicate="dwithin", distance=max_meters_between_clear_cuts)
        .reset_index()
        .rename(columns={"index": "index_left"})
    )

    # Ignore clear-cuts that intersect with themselves
    clear_cut_pairs = clear_cut_pairs[
        clear_cut_pairs["index_left"] != clear_cut_pairs["index_right"]
    ]

    # Remove duplicates (left -> right exists, ignore right -> left)
    clear_cut_pairs = clear_cut_pairs[
        clear_cut_pairs["index_left"] < clear_cut_pairs["index_right"]
    ]

    # Remove pairs if the date difference is too big
    clear_cut_pairs = clear_cut_pairs[
        (clear_cut_pairs["date_left"] - clear_cut_pairs["date_right"]).dt.days.abs()
        <= max_days_between_clear_cuts
    ]

    logger.info(
        f"Found {len(clear_cut_pairs)} potential clear-cut pairs (before shape complexity filtering)"
    )

    return clear_cut_pairs


def regroup_clear_cut_pairs(clear_cut_pairs: pd.DataFrame) -> list[set[int]]:
    """
    Groups connected clear-cut pairs into distinct sets (clusters).

    Given a set of identified clear-cut pairs, this function groups all
    interconnected clear cuts into the same set using a disjoint-set
    data structure (also known as a union-find algorithm).

    Parameters
    ----------
    clear_cut_pairs : pd.DataFrame
        DataFrame containing pairs of clear-cut IDs that are connected,
        with columns 'index_left' and 'index_right'.

    Returns
    -------
    list[set[int]]
        A list of sets, where each set contains the IDs of clear cuts
        belonging to the same cluster.

    Examples
    --------
    If we have four clear cuts (A, B, C, and D) and the identified pairs
    are (A, B) and (B, D), the function will group them as:
    - Group 1: {A, B, D}
    - Group 2: {C}
    """
    logger.info("Grouping connected clear-cuts into clusters")

    # Get all unique clear-cut indices from both columns
    all_indices = pd.concat(
        [clear_cut_pairs["index_left"], clear_cut_pairs["index_right"]]
    ).unique()

    # Start with each clear cut having its own group
    clear_cuts_disjoint_set = DisjointSet(all_indices)

    # Group the clear cuts that belong together one pair at a time
    for index_left, index_right in tqdm(
        clear_cut_pairs[["index_left", "index_right"]].itertuples(index=False),
        total=len(clear_cut_pairs),
        desc="Merging connected clear-cuts",
    ):
        clear_cuts_disjoint_set.merge(index_left, index_right)

    # Get the resulting subsets (clusters)
    subsets = clear_cuts_disjoint_set.subsets()

    logger.info(f"Created {len(subsets)} clear-cut clusters")

    return subsets


def cluster_clear_cuts(
    gdf: gpd.GeoDataFrame, 
    max_meters_between_clear_cuts: int, 
    max_days_between_clear_cuts: int) -> gpd.GeoDataFrame:
    """
    Clusters individual clear-cuts based on spatial and temporal proximity.
    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons with 'date' and 'geometry' columns.
    max_meters_between_clear_cuts : int
        Maximum distance in meters between clear-cuts to consider them related.
    max_days_between_clear_cuts : int
        Maximum time difference in days between clear-cuts to consider them related.

    Returns
    -------
    gpd.GeoDataFrame
        The input GeoDataFrame with an additional 'clear_cut_group' column
        that assigns each polygon to a cluster.

    Notes
    -----
    The function modifies the input GeoDataFrame by adding a 'clear_cut_group' column.
    """
    logger.info("Clustering clear-cuts by spatial and temporal proximity")

    # Identify the clear cut groups
    clear_cut_pairs = pair_clear_cuts_through_space_and_time(
        gdf, max_meters_between_clear_cuts, max_days_between_clear_cuts
    )
    clear_cut_groups = regroup_clear_cut_pairs(clear_cut_pairs)

    # Assign a clear cut group id to each clear cut polygon
    logger.info("Assigning cluster IDs to clear-cuts")
    for i, subset in tqdm(
        enumerate(clear_cut_groups), total=len(clear_cut_groups), desc="Assigning cluster IDs"
    ):
        gdf.loc[list(subset), "clear_cut_group"] = i

    logger.info(f"Clustering complete: {gdf['clear_cut_group'].nunique()} total clusters")

    return gdf


def union_clear_cut_clusters(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Combines clear-cuts belonging to the same cluster into single geometries.

    This function dissolves the geometries based on the 'clear_cut_group' column,
    and calculates aggregate statistics for each cluster.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame with 'clear_cut_group', 'date', and 'geometry' columns.

    Returns
    -------
    gpd.GeoDataFrame
        A new GeoDataFrame with one row per cluster, containing:
        - Unified geometry
        - Minimum and maximum dates
        - Time span of the cluster in days
        - Number of clear-cuts in each cluster
    """
    logger.info("Merging clear-cuts within each cluster")

    # Calculate group sizes before dissolve
    clear_cut_group_size = gdf.groupby("clear_cut_group").size()

    logger.info("Performing spatial union of geometries within each cluster")
    gdf = gdf.dissolve(by="clear_cut_group", aggfunc={"date": ["min", "max"]}).rename(
        columns={
            ("date", "min"): "date_min",
            ("date", "max"): "date_max",
        }
    )
    gdf["days_delta"] = (gdf["date_max"] - gdf["date_min"]).dt.days
    gdf["clear_cut_group_size"] = clear_cut_group_size

    # Fill tiny gaps left after the dissolve/union operation
    logger.info("Filling tiny gaps in the dissolved geometries")
    gdf["geometry"] = gdf["geometry"].buffer(0.0001)

    logger.info(f"Successfully created {len(gdf)} merged clear-cut clusters")

    return gdf


def filter_out_clear_cuts_with_complex_shapes(
    gdf: gpd.GeoDataFrame, 
    concave_hull_ratio: float, 
    concave_hull_score_threshold: float) -> gpd.GeoDataFrame:
    """
    Filters out clear-cuts with overly complex shapes that may represent false positives.

    This function uses the concave hull score (ratio of the area of the shape to the
    area of its concave hull) to identify and remove shapes that are too complex.

    Parameters
    ----------
    gdf : gpd.GeoDataFrame
        GeoDataFrame containing clear-cut polygons.
    concave_hull_ratio : float
        Ratio parameter for the concave hull calculation (1.0 = convex hull).
        Lower values create tighter hulls that follow the shape more closely.
    concave_hull_score_threshold : float
        Minimum acceptable concave hull score. Polygons with scores below this
        threshold will be removed.

    Returns
    -------
    gpd.GeoDataFrame
        Filtered GeoDataFrame with complex shapes removed.

    Notes
    -----
    The concave hull score (area of polygon / area of concave hull) provides a measure
    of shape complexity. Values close to 0 indicate more complex, irregular shapes,
    while large values indicate simpler shapes. The score can be greater than 1.
    """
    logger.info("Filtering out clear-cuts with complex shapes")

    # concave_hull(ratio=1) would be the same as convex_hull
    gdf["concave_hull_score"] = gdf.area / gdf.concave_hull(concave_hull_ratio).area

    logger.info(
        f"Dropping {(gdf['concave_hull_score'] < concave_hull_score_threshold).sum() / len(gdf):.1%} of the clear-cut clusters because their concave hull score is too low, meaning their shape is too complex."
    )

    # Filter out clear cuts that are too complex, and get rid of the score since it won't be useful later
    gdf = gdf[gdf["concave_hull_score"] >= concave_hull_score_threshold].drop(
        columns="concave_hull_score"
    )

    return gdf

# Generalized tools for validating data

def save_data(data, filepath):
    """
    Saves the given data to a specified file path in Parquet format.
    Args:
        data (pandas.DataFrame): The data to be saved.
        filepath (str): The file path where the data will be saved.
    Logs:
        Logs the file path where the data is being saved.
    Raises:
        ValueError: If the data cannot be saved to the specified file path.
    """
    logger.info(f"Loading the file in : {filepath}...")
    data.to_parquet(filepath)