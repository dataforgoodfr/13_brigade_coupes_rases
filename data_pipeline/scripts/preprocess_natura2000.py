import logging

import geopandas as gpd
import pandas as pd

from scripts import DATA_DIR
from scripts.utils import display_df, download_file, load_gdf, log_execution

NATURA_2000_DIR = DATA_DIR / "natura2000"


def download_layers() -> None:
    logging.info("Downloading the Natura 2000 ZPS and SIC layers")
    download_file("https://inpn.mnhn.fr/docs/Shape/zps.zip", NATURA_2000_DIR / "zps.zip")
    download_file("https://inpn.mnhn.fr/docs/Shape/sic.zip", NATURA_2000_DIR / "sic.zip")
    logging.info("Natura 2000 layers download complete")


def load_layers() -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    logging.info("Loading the ZPS and SIC layers")
    zps = load_gdf(NATURA_2000_DIR / "zps.zip")
    sic = load_gdf(NATURA_2000_DIR / "sic.zip")
    logging.info("Layers loaded successfully")
    return zps, sic


def union_explode_layers(zps: gpd.GeoDataFrame, sic: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    assert zps.crs == sic.crs, "We expect both layers to share the same CRS"

    logging.info("Unioning ZPS and SIC layers to remove overlaps")
    natura2000 = gpd.GeoDataFrame(geometry=[pd.concat([zps, sic]).union_all()], crs=zps.crs)
    display_df(natura2000)

    logging.info("Exploding the resulting multipolygon into smaller individual polygons")
    natura2000 = natura2000.explode().reset_index(drop=True)
    display_df(natura2000)

    return natura2000


def save_result(natura2000: gpd.GeoDataFrame) -> None:
    output_filepath = NATURA_2000_DIR / "natura2000.fgb"
    logging.info(f"Saving the result to disk in {output_filepath}")
    natura2000.to_file(output_filepath, index=False)


@log_execution
def main() -> None:
    download_layers()
    zps, sic = load_layers()
    natura2000 = union_explode_layers(zps, sic)
    save_result(natura2000)


if __name__ == "__main__":
    main()
