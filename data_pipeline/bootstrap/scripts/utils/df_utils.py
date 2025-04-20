import logging
import os
from pathlib import Path

import geopandas as gpd
import pandas as pd


def display_df(df: pd.DataFrame) -> None:
    logging.info(
        "Data preview:\n"
        + df.to_string(max_rows=10, max_colwidth=50, show_dimensions=True)
    )


def load_gdf(input_filepath: str | Path, rows: int | None = None) -> gpd.GeoDataFrame:
    logging.info(f"Loading {input_filepath} as a gpd.GeoDataFrame")
    gdf = gpd.read_file(input_filepath, rows=rows)
    logging.info(f"Coordinate Reference System (CRS) of the GeoDataFrame: {gdf.crs}")
    display_df(gdf)
    return gdf


def save_gdf(
    gdf: gpd.GeoDataFrame, output_filepath: str | Path, index: bool = False
) -> gpd.GeoDataFrame:
    display_df(gdf)

    # Save the GeoDataFrame to the specified file
    gdf.to_file(output_filepath, index=index)

    # Get the file size
    file_size = os.path.getsize(output_filepath)
    logging.info(
        f"File saved to {output_filepath} (Memory usage: {file_size / (1024 * 1024):,.0f} MB)"
    )

    return gdf
