# -*- coding: utf-8 -*-
"""
Created on Sun Apr 20 12:01:49 2025

@author: cindy
"""
import logging

import pandas as pd
import dask_geopandas
import geopandas as gpd

from scripts import DATA_DIR
from scripts.utils import display_df, download_file, overlay, log_execution, save_gdf
from scripts.utils.df_utils import load_gdf

ENRICHED_CLUSTERS_RESULT_FILEPATH = DATA_DIR / "sufosat/sufosat_clusters_enriched.fgb"
NATURA_2000_DIR = DATA_DIR / "natura2000"
CONCAT_RESULT_FILEPATH = NATURA_2000_DIR / "natura2000_concat.fgb"
UNION_RESULT_FILEPATH = NATURA_2000_DIR / "natura2000_union.fgb"


def enrich_with_natura2000_area(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with Natura 2000 area information")

    # Load Natura 2000 data
    # It is important to use the unioned Natura2000 geodataframe to avoid counting the same area multiple times
    natura2000_union = load_gdf(DATA_DIR / "natura2000/natura2000_union.fgb")

    # Calculate intersection area in hectares (1 hectare = 10,000 m²)
    natura2000_area_ha = overlay(sufosat_dask, natura2000_union).area.compute() / 10000

    # Add Natura 2000 area to the SUFOSAT DataFrame
    sufosat.loc[natura2000_area_ha.index, "natura2000_area_ha"] = natura2000_area_ha

    # Fill NA values with 0 (no intersection with Natura 2000)
    sufosat["natura2000_area_ha"] = sufosat["natura2000_area_ha"].fillna(0)

    logging.info(f"{len(natura2000_area_ha)} clusters intersect with Natura 2000 areas")

    display_df(sufosat)

    return sufosat


def enrich_with_natura2000_codes(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with Natura 2000 codes information")

    # Load Natura 2000 data
    # It is important to use the unioned Natura2000 geodataframe to avoid counting the same area multiple times
    natura2000_concat = load_gdf(DATA_DIR / "natura2000/natura2000_concat.fgb")

    # Find the Natura2000 codes that intersect with the clear-cuts
    natura2000_codes = overlay(sufosat_dask, natura2000_concat)
    natura2000_codes = (
        natura2000_codes.groupby(natura2000_codes.index)["code"].agg(list).compute()
    )

    # Add Natura 2000 area to the SUFOSAT DataFrame
    sufosat.loc[natura2000_codes.index, "natura2000_codes"] = natura2000_codes

    display_df(sufosat)

    return sufosat


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


def concat_layers(zps: gpd.GeoDataFrame, sic: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    assert zps.crs == sic.crs, "We expect both layers to share the same CRS"

    logging.info("Concatenating ZPS and SIC layers")

    # Concatenate
    zps["type"] = "ZPS"
    sic["type"] = "SIC"
    natura2000_concat = pd.concat([zps, sic], ignore_index=True)

    # Make sure it remains a GeoDataFrame
    natura2000_concat = gpd.GeoDataFrame(natura2000_concat, geometry="geometry", crs=zps.crs)

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

    logging.info("Exploding the resulting multipolygon into smaller individual polygons")
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