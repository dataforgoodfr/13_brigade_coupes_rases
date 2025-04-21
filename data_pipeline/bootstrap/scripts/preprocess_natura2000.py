import logging

import geopandas as gpd
import pandas as pd

from bootstrap.scripts import DATA_DIR
from bootstrap.scripts.utils import (
    display_df,
    download_file,
    load_gdf,
    log_execution,
    save_gdf,
)

NATURA_2000_DIR = DATA_DIR / "natura2000"
CONCAT_RESULT_FILEPATH = NATURA_2000_DIR / "natura2000_concat.fgb"
UNION_RESULT_FILEPATH = NATURA_2000_DIR / "natura2000_union.fgb"


def download_layers() -> None:
    logging.info("Downloading the Natura 2000 ZPS and SIC layers")
    download_file(
        "https://inpn.mnhn.fr/docs/Shape/zps.zip", NATURA_2000_DIR / "zps.zip"
    )
    download_file(
        "https://inpn.mnhn.fr/docs/Shape/sic.zip", NATURA_2000_DIR / "sic.zip"
    )
    logging.info("Natura 2000 layers download complete")


def load_layers() -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    logging.info("Loading the ZPS and SIC layers")
    zps = load_gdf(NATURA_2000_DIR / "zps.zip")
    sic = load_gdf(NATURA_2000_DIR / "sic.zip")
    logging.info("Layers loaded successfully")
    return zps, sic


def concat_layers(zps: gpd.GeoDataFrame, sic: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    assert zps.crs == sic.crs, "We expect both layers to share the same CRS"

    logging.info("Concatenating ZPS and SIC layers")

    # Concatenate
    zps["type"] = "ZPS"
    sic["type"] = "SIC"
    natura2000_concat = pd.concat([zps, sic], ignore_index=True)

    # Make sure it remains a GeoDataFrame
    natura2000_concat = gpd.GeoDataFrame(
        natura2000_concat, geometry="geometry", crs=zps.crs
    )

    natura2000_concat = natura2000_concat.rename(
        columns={
            "SITECODE": "code",
            "SITENAME": "name",
        }
    )[["type", "code", "name", "geometry"]]

    display_df(natura2000_concat)

    return natura2000_concat


def union_explode_layers(natura2000_concat: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info("Unioning ZPS and SIC layers to remove overlaps")
    natura2000 = gpd.GeoDataFrame(
        geometry=[natura2000_concat.union_all()], crs=natura2000_concat.crs
    )
    display_df(natura2000)

    logging.info(
        "Exploding the resulting multipolygon into smaller individual polygons"
    )
    natura2000 = natura2000.explode().reset_index(drop=True)
    display_df(natura2000)

    return natura2000


@log_execution([CONCAT_RESULT_FILEPATH, UNION_RESULT_FILEPATH])
def preprocess_natura2000() -> None:
    download_layers()
    zps, sic = load_layers()
    natura2000_concat = concat_layers(zps, sic)
    save_gdf(natura2000_concat, CONCAT_RESULT_FILEPATH)
    natura2000_union = union_explode_layers(natura2000_concat)
    save_gdf(natura2000_union, UNION_RESULT_FILEPATH)


if __name__ == "__main__":
    preprocess_natura2000()
