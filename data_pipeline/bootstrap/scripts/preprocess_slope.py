import logging
import os
import resource
import shutil
import zipfile

import geopandas as gpd
import numpy as np
import py7zr
import rasterio
from osgeo import gdal
from rasterio.merge import merge
from tqdm import tqdm

from bootstrap.scripts import DATA_DIR
from bootstrap.scripts.utils import (
    display_df,
    download_file,
    load_gdf,
    log_execution,
    polygonize_raster,
)

SLOPE_DIR = DATA_DIR / "slope"
RESULT_FILEPATH = SLOPE_DIR / "slope_gte_30.fgb"


def get_dem_assembly_map() -> gpd.GeoDataFrame:
    logging.info("Downloading the BD ALTI DEM 25m x 25m assembly map")
    assembly_map_name = "BDALTIV2_2-0_TA-25M_SHP_WGS84G_FXX_2023-10-19"
    assembly_map_dir = SLOPE_DIR / "assembly_map"
    zip_filepath = assembly_map_dir / f"{assembly_map_name}.zip"
    sevenzip_filepath = assembly_map_dir / f"{assembly_map_name}.7z"
    download_file(
        f"https://geoservices.ign.fr/sites/default/files/2023-10/{assembly_map_name}.zip",
        zip_filepath,
    )

    logging.info("Extracting the assembly map Shapefile from the zip")

    # Extract the .7z file from the .zip archive
    with zipfile.ZipFile(zip_filepath, "r") as zip_ref:
        zip_ref.extract(sevenzip_filepath.name, sevenzip_filepath.parent)

    # Extract the content from the .7z file
    with py7zr.SevenZipFile(sevenzip_filepath, mode="r") as sevenzip_ref:
        sevenzip_ref.extractall(path=assembly_map_dir)

    logging.info("Loading the assembly map")
    tiles = load_gdf(assembly_map_dir / assembly_map_name)

    logging.info("Filtering to keep the tiles for mainland France")
    tiles = tiles.drop_duplicates("NOM_DALLE")
    tiles = tiles[tiles["SRC"] == "LAMB93"]
    tiles = tiles[["NOM_DALLE", "geometry"]].rename(columns={"NOM_DALLE": "tile_name"})

    logging.info("These are the final tiles from the DEM")
    display_df(tiles)

    return tiles


def download_dem_tiles() -> None:
    """
    The tiles can be downloaded from the [BD ALTI](https://geoservices.ign.fr/bdalti) page.
    We download the tiles for each department individually and save them to the `archives/` folder.
    """

    logging.info("Downloading the DEM tiles")
    urls_to_download = [
        "https://data.geopf.fr/telechargement/download/BDALTI/BDALTIV2_2-0_25M_ASC_LAMB93-"
        + filename
        for filename in [
            "IGN69_D001_2023-08-08/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D001_2023-08-08.7z",
            "IGN69_D002_2020-09-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D002_2020-09-04.7z",
            "IGN69_D003_2023-08-10/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D003_2023-08-10.7z",
            "IGN69_D004_2023-08-08/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D004_2023-08-08.7z",
            "IGN69_D005_2021-08-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D005_2021-08-04.7z",
            "IGN69_D006_2023-08-08/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D006_2023-08-08.7z",
            "IGN69_D007_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D007_2022-12-16.7z",
            "IGN69_D008_2019-10-14/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D008_2019-10-14.7z",
            "IGN69_D009_2023-10-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D009_2023-10-04.7z",
            "IGN69_D010_2021-11-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D010_2021-11-04.7z",
            "IGN69_D011_2023-10-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D011_2023-10-04.7z",
            "IGN69_D012_2022-09-29/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D012_2022-09-29.7z",
            "IGN69_D013_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D013_2022-12-16.7z",
            "IGN69_D014_2022-12-21/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D014_2022-12-21.7z",
            "IGN69_D015_2022-09-29/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D015_2022-09-29.7z",
            "IGN69_D016_2023-07-28/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D016_2023-07-28.7z",
            "IGN69_D017_2023-07-28/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D017_2023-07-28.7z",
            "IGN69_D018_2023-01-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D018_2023-01-03.7z",
            "IGN69_D019_2019-12-10/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D019_2019-12-10.7z",
            "IGN78C_D02A_2020-04-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN78C_D02A_2020-04-16.7z",
            "IGN78C_D02B_2020-04-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN78C_D02B_2020-04-16.7z",
            "IGN69_D021_2023-01-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D021_2023-01-03.7z",
            "IGN69_D022_2022-10-14/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D022_2022-10-14.7z",
            "IGN69_D023_2019-11-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D023_2019-11-20.7z",
            "IGN69_D024_2019-10-17/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D024_2019-10-17.7z",
            "IGN69_D025_2021-01-13/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D025_2021-01-13.7z",
            "IGN69_D026_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D026_2022-12-16.7z",
            "IGN69_D027_2022-12-21/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D027_2022-12-21.7z",
            "IGN69_D028_2020-01-22/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D028_2020-01-22.7z",
            "IGN69_D029_2022-10-14/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D029_2022-10-14.7z",
            "IGN69_D030_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D030_2022-12-16.7z",
            "IGN69_D031_2021-05-12/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D031_2021-05-12.7z",
            "IGN69_D032_2021-02-11/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D032_2021-02-11.7z",
            "IGN69_D033_2021-05-11/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D033_2021-05-11.7z",
            "IGN69_D034_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D034_2022-12-16.7z",
            "IGN69_D035_2022-12-15/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D035_2022-12-15.7z",
            "IGN69_D036_2022-09-28/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D036_2022-09-28.7z",
            "IGN69_D037_2023-07-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D037_2023-07-20.7z",
            "IGN69_D038_2020-11-13/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D038_2020-11-13.7z",
            "IGN69_D039_2023-08-08/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D039_2023-08-08.7z",
            "IGN69_D040_2021-04-19/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D040_2021-04-19.7z",
            "IGN69_D041_2020-01-22/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D041_2020-01-22.7z",
            "IGN69_D042_2023-08-10/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D042_2023-08-10.7z",
            "IGN69_D043_2022-10-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D043_2022-10-03.7z",
            "IGN69_D044_2022-12-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D044_2022-12-20.7z",
            "IGN69_D045_2023-01-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D045_2023-01-03.7z",
            "IGN69_D046_2019-12-10/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D046_2019-12-10.7z",
            "IGN69_D047_2019-11-21/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D047_2019-11-21.7z",
            "IGN69_D048_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D048_2022-12-16.7z",
            "IGN69_D049_2023-07-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D049_2023-07-20.7z",
            "IGN69_D050_2022-12-21/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D050_2022-12-21.7z",
            "IGN69_D051_2020-09-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D051_2020-09-04.7z",
            "IGN69_D052_2021-01-13/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D052_2021-01-13.7z",
            "IGN69_D053_2023-01-12/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D053_2023-01-12.7z",
            "IGN69_D054_2021-11-02/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D054_2021-11-02.7z",
            "IGN69_D055_2019-10-17/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D055_2019-10-17.7z",
            "IGN69_D056_2022-12-15/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D056_2022-12-15.7z",
            "IGN69_D057_2021-11-02/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D057_2021-11-02.7z",
            "IGN69_D058_2023-08-10/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D058_2023-08-10.7z",
            "IGN69_D059_2021-09-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D059_2021-09-20.7z",
            "IGN69_D060_2020-09-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D060_2020-09-04.7z",
            "IGN69_D061_2023-01-12/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D061_2023-01-12.7z",
            "IGN69_D062_2021-09-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D062_2021-09-20.7z",
            "IGN69_D063_2021-01-22/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D063_2021-01-22.7z",
            "IGN69_D064_2021-04-19/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D064_2021-04-19.7z",
            "IGN69_D065_2020-02-11/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D065_2020-02-11.7z",
            "IGN69_D066_2023-10-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D066_2023-10-04.7z",
            "IGN69_D067_2021-11-02/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D067_2021-11-02.7z",
            "IGN69_D068_2021-11-02/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D068_2021-11-02.7z",
            "IGN69_D069_2023-08-10/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D069_2023-08-10.7z",
            "IGN69_D070_2021-01-13/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D070_2021-01-13.7z",
            "IGN69_D071_2023-01-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D071_2023-01-03.7z",
            "IGN69_D072_2023-01-12/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D072_2023-01-12.7z",
            "IGN69_D073_2020-10-15/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D073_2020-10-15.7z",
            "IGN69_D074_2020-10-15/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D074_2020-10-15.7z",
            "IGN69_D075_2020-07-30/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D075_2020-07-30.7z",
            "IGN69_D076_2020-10-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D076_2020-10-20.7z",
            "IGN69_D077_2021-03-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D077_2021-03-03.7z",
            "IGN69_D078_2020-07-30/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D078_2020-07-30.7z",
            "IGN69_D079_2023-07-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D079_2023-07-20.7z",
            "IGN69_D080_2020-09-04/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D080_2020-09-04.7z",
            "IGN69_D081_2022-07-29/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D081_2022-07-29.7z",
            "IGN69_D082_2021-02-11/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D082_2021-02-11.7z",
            "IGN69_D083_2022-12-05/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D083_2022-12-05.7z",
            "IGN69_D084_2022-12-16/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D084_2022-12-16.7z",
            "IGN69_D085_2023-08-11/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D085_2023-08-11.7z",
            "IGN69_D086_2023-07-20/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D086_2023-07-20.7z",
            "IGN69_D087_2021-10-26/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D087_2021-10-26.7z",
            "IGN69_D088_2021-11-02/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D088_2021-11-02.7z",
            "IGN69_D089_2023-01-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D089_2023-01-03.7z",
            "IGN69_D090_2021-01-13/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D090_2021-01-13.7z",
            "IGN69_D091_2021-03-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D091_2021-03-03.7z",
            "IGN69_D092_2021-03-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D092_2021-03-03.7z",
            "IGN69_D093_2020-07-30/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D093_2020-07-30.7z",
            "IGN69_D094_2021-03-03/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D094_2021-03-03.7z",
            "IGN69_D095_2020-07-30/BDALTIV2_2-0_25M_ASC_LAMB93-IGN69_D095_2020-07-30.7z",
        ]
    ]

    archives_dir = SLOPE_DIR / "elevation_archives"
    for url in tqdm(
        urls_to_download, desc="Downloading the tiles of all the mainland French departments"
    ):
        filename = url.split("/")[-1]
        filepath = archives_dir / filename
        download_file(url, filepath)


def decompress_dem_tiles() -> None:
    """
    There are a lot of files in the department archives, but we are only interested by the DEM tiles.
    We extract them to a new `elevation/` folder.
    """

    logging.info("Decompressing the DEM tiles zip files")
    compressed_dir = SLOPE_DIR / "elevation_archives"
    uncompressed_dir = SLOPE_DIR / "elevation"

    for archive_filename in tqdm(
        sorted(os.listdir(compressed_dir)), desc="Uncompressing the IGN tiles .7z files"
    ):
        # Extract the tiles files
        with py7zr.SevenZipFile(compressed_dir / archive_filename) as archive:
            tile_filepaths = [f for f in archive.getnames() if f.endswith(".asc")]
            archive.extract(targets=tile_filepaths, path=uncompressed_dir)

        # Move the tiles from their extract folder to the uncompressed folder
        for tile_filpath in tile_filepaths:
            # Don't move the tile if it already exists
            # It can happen since departments share tiles at their borders
            if not (uncompressed_dir / tile_filpath.split("/")[-1]).exists():
                shutil.move(uncompressed_dir / tile_filpath, uncompressed_dir)

        # Delete the empty folder
        shutil.rmtree(uncompressed_dir / archive_filename.replace(".7z", ""))


def downloaded_tiles_sanity_check(assembly_map: gpd.GeoDataFrame) -> None:
    """
    We perform a sanity check to ensure that the uncompressed tiles in our folder
    matches the tiles listed in the assembly map.
    """

    logging.info(
        f"Making sure we downloaded the {len(assembly_map)} tiles from the assembly map"
    )
    tiles = [
        f.replace(".asc", "") for f in os.listdir(SLOPE_DIR / "elevation") if f.endswith(".asc")
    ]
    assert assembly_map["tile_name"].isin(tiles).sum() == len(assembly_map), (
        "We have a discrepency between the assembly map and the downloaded tiles"
    )

    logging.info("Making sure the CRS of the tiles is Lambert-93")
    # The CRS is not set in the raster file, but the CRS is indicated in the tile name
    for tile in tiles:
        assert "LAMB93" in tile, "We are expecting Lambert-93 tiles"


def compute_slope_from_elevation() -> None:
    """
    Convert the elevation (in meters) to slope (in %). We will use the Horn algorithm for this conversion.
    For more information on Horn's algorithm, check out https://www.aazuspan.dev/blog/terrain-algorithms-from-scratch/.
    """

    logging.info("Computing slope percentage from the elevation tiles using the Horn algorithm")
    (SLOPE_DIR / "slope").mkdir(exist_ok=True, parents=True)
    for filename in tqdm(os.listdir(SLOPE_DIR / "elevation"), ""):
        elevation_input_filepath = str(SLOPE_DIR / "elevation" / filename)
        # The tiles are available as .asc ASCII files, which are not very optimized.
        # We convert them to TIFF files for better performance and storage efficiency.
        slope_output_filepath = str(SLOPE_DIR / "slope" / filename.replace(".asc", ".tif"))
        gdal.DEMProcessing(
            slope_output_filepath,
            gdal.Open(elevation_input_filepath),
            "slope",
            # By default the edges are None because the Horn algorithm uses a 3x3 kernel that cannot run on the edges
            # With `computeEdges=True`, the input array is extended beyond its boundaries to allow us to run the 3x3
            # kernel and avoid None values
            computeEdges=True,
            slopeFormat="percent",
        )


def binarize_slope_gte_30() -> None:
    """
    For our use case, the exact slope value (whether it's 7% or 42%) isn't very important.
    We only need to know if the slope is greater than or equal to 30%.
    Therefore, we binarize the data. This will simplify processing later and helps save a
    lot of storage space, as the raster becomes very sparse with only a few pixels having values >= 30%.
    """

    logging.info("Binarize the slope raster files (1 if slope >= 30% else 0)")

    # Create the output dir if it doesn't exist yet
    (SLOPE_DIR / "slope_gte_30").mkdir(exist_ok=True, parents=True)

    # For each slope raster file
    for filename in tqdm(os.listdir(SLOPE_DIR / "slope")):
        slope_input_filepath = str(SLOPE_DIR / "slope" / filename)
        slope_gte_30_output_filepath = str(SLOPE_DIR / "slope_gte_30" / filename)

        # Open the raster file
        with rasterio.open(slope_input_filepath) as src:
            data = src.read(1)  # Read the first (or only) band
            profile = src.profile  # Copy metadata

        # Apply the threshold
        binary_data = np.where(data >= 30, 1, 0)

        # Remove unsupported creation options for COG
        profile.pop("blockxsize", None)
        profile.pop("blockysize", None)
        profile.pop("tiled", None)
        profile.pop("interleave", None)

        # Update metadata
        profile.update(
            dtype=rasterio.uint8,  # Save as integer
            nodata=0,  # Ignore nodata values and set them to 0 too
            driver="COG",  # Optimized for sparse data
        )

        # Save the result
        with rasterio.open(slope_gte_30_output_filepath, "w", **profile) as dst:
            dst.write(binary_data.astype(rasterio.uint8), 1)


def merge_raster_tiles() -> None:
    """
    At this point, we still have 1,017 individual tiles to manage.
    Since the data is very sparse, it is manageable to merge them all into a single raster file.
    While we won't be able to load the entire resulting grid into memory as a dense array,
    raster data allows us to load only specific areas of the file.
    In our case, we can load just the areas or bounding box around the clear cuts.
    """
    logging.info("Merging the individual raster tiles")

    # We open more than 1000 tiles which can go beyond the default Linux limit of 1,024
    # We increase it to avoid the following error:
    # GDAL signalled an error: err_no=4, msg="Attempt to create new tiff file `/home/ycrouin/Desktop/13_brigade_coupes_rases/data_pipeline/data/slope/slope_gte_30.tif' failed: Too many open files"
    soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
    new_limit = 10000  # 10,000 should be enough
    resource.setrlimit(resource.RLIMIT_NOFILE, (new_limit, hard))

    # Open the rasters
    src_files_to_mosaic = [
        rasterio.open(SLOPE_DIR / "slope_gte_30" / filename)
        for filename in os.listdir(SLOPE_DIR / "slope_gte_30")
    ]

    # Merge rasters
    mosaic, out_transform = merge(src_files_to_mosaic)

    # Update metadata
    out_meta = src_files_to_mosaic[0].meta.copy()
    out_meta.update(
        {
            "driver": "COG",  # Optimized for sparse data
            "height": mosaic.shape[1],
            "width": mosaic.shape[2],
            "transform": out_transform,
        }
    )

    # Write to a new raster file
    logging.info(f"Create the {SLOPE_DIR / 'slope_gte_30.tif'} merged raster file")
    with rasterio.open(SLOPE_DIR / "slope_gte_30.tif", "w", **out_meta) as dest:
        dest.write(mosaic)

    # Close the opened rasters
    for src in src_files_to_mosaic:
        src.close()


def polygonize_slope_raster() -> None:
    """
    To detect abusive clear-cuts based on slope, the criteria is the following:

    > A clear-cut is considered abusive if it contains a contiguous area of at least
    2 hectares with a slope of 30% or greater. If there are two separate areas of 1
    hectare each with a slope of 30% or greater, but they are not contiguous, the
    clear-cut is not considered abusive.

    To enforce this criterion, we will likely need to use a slope layer instead of
    our current slope raster. Although the polygon layer requires significantly more
    storage (~600MB vs. ~30MB for the raster), we are vectorizing it now for convenience.
    """
    logging.info("Polygonize the slope raster")
    polygonize_raster(
        input_raster=str(SLOPE_DIR / "slope_gte_30.tif"),
        output_layer_file=str(RESULT_FILEPATH),
        # We need to explicitely set Lambert-93 because the info is not present in the tif file
        src_crs_epsg=2154,
    )

    logging.info("Final slope geodataframe")
    load_gdf(RESULT_FILEPATH)


@log_execution(RESULT_FILEPATH)
def preprocess_slope() -> None:
    assembly_map = get_dem_assembly_map()
    download_dem_tiles()
    decompress_dem_tiles()
    downloaded_tiles_sanity_check(assembly_map)
    compute_slope_from_elevation()
    binarize_slope_gte_30()
    merge_raster_tiles()
    polygonize_slope_raster()


if __name__ == "__main__":
    preprocess_slope()
