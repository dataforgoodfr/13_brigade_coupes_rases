# -*- coding: utf-8 -*-
"""
Created on Sat Apr 12 20:20:22 2025

@author: cindy
"""

import logging
import gzip
import shutil

import geopandas as gpd

from scripts import DATA_DIR
from scripts.utils import display_df, download_file, load_gdf

CADASTRE_DEPARTMENTS_DIR = DATA_DIR / "cadastre_departments"
RESULT_FILEPATH = CADASTRE_DEPARTMENTS_DIR / "cadastre_departments.fgb"


def download_cadastre(cad_type, url, cad_dir) -> gpd.GeoDataFrame:
    logging.info(f"Downloading the cadastre for {cad_type}")

    download_file(url, cad_dir)
    result = load_gdf(cad_dir)
    return result


def unzip(gz_file, json_file):
    logging.info("Unzipping the gzipped json")
    with gzip.open(gz_file, "rb") as f_in:
        with open(json_file, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    result = load_gdf(json_file)
    return result


def remove_overseas(cad_type: gpd.GeoDataFrame, col, listed) -> gpd.GeoDataFrame:
    logging.info(f"Removing the overseas {cad_type}")
    if cad_type == "departments":
        cad_type = cad_type[~cad_type[col].isin(listed)]
    else:
        cad_type = cad_type[~cad_type[col].str.startswith(listed)]
    display_df(cad_type)
    return cad_type


def convert_crs_to_lambert93(cad_type: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info("Convert CRS to Lambert93 like the other project layers")
    cad_type = cad_type.to_crs(epsg=2154)
    return cad_type
