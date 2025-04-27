# Custom code derived from Yoann Crouin's written code.
# link --> https://github.com/dataforgoodfr/13_brigade_coupes_rases/blob/feat/dataeng/prepare_abusive_clear_cuts_2018_2025/data_pipeline/scripts/utils/df_utils.py
# # -*- coding: utf-8 -*-
import os
from pathlib import Path

import geopandas as gpd
import pandas as pd
from utils.logging_etl import etl_logger

# Loading the logger settings
logger = etl_logger("logs/transform.log")


def display_df(df: pd.DataFrame) -> None:
    logger.info(
        "Data preview:\n"
        + df.to_string(max_rows=10, max_colwidth=50, show_dimensions=True)
    )


def load_gdf(input_filepath: str | Path) -> gpd.GeoDataFrame:
    logger.info(f"Loading {input_filepath} as a gpd.GeoDataFrame")
    gdf = gpd.read_file(input_filepath)
    logger.info(f"Coordinate Reference System (CRS) of the GeoDataFrame: {gdf.crs}")
    display_df(gdf)

    return gdf


# modified --> export on geoparquet
def save_gdf(
    gdf: gpd.GeoDataFrame, output_filepath: str | Path, index: bool = False
) -> gpd.GeoDataFrame:
    display_df(gdf)

    # Save the GeoDataFrame to the specified file
    gdf.to_parquet(output_filepath, index=index)

    # Get the file size
    file_size = os.path.getsize(output_filepath)
    logger.info(
        f"File saved to {output_filepath} (Memory usage: {file_size / (1024 * 1024):,.0f} MB)"
    )

    return gdf
