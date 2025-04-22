# -*- coding: utf-8 -*-
"""
Created on Sun Apr 20 12:10:50 2025

@author: cindy
"""

import logging

import geopandas as gpd

from scripts import DATA_DIR
from scripts.utils import display_df, download_file, load_gdf, log_execution, save_gdf
from scripts.utils.convert_crs import convert_crs_to_lambert93

CADASTRE_DEPARTMENTS_DIR = DATA_DIR / "cadastre_departments"
RESULT_FILEPATH = CADASTRE_DEPARTMENTS_DIR / "cadastre_departments.fgb"


def download_osm_departments_cadastre() -> gpd.GeoDataFrame:
    logging.info("Downloading the OpenStreeMap cadastre for departments")

    # See https://www.data.gouv.fr/fr/datasets/contours-des-departements-francais-issus-d-openstreetmap/
    download_file(
        "https://www.data.gouv.fr/fr/datasets/r/eb36371a-761d-44a8-93ec-3d728bec17ce",
        CADASTRE_DEPARTMENTS_DIR / "departements-20180101-shp.zip",
    )

    departments = load_gdf(CADASTRE_DEPARTMENTS_DIR / "departements-20180101-shp.zip")

    return departments


def remove_overseas_departments(departments: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info("Removing the overseas departments")
    # Remove the overseas departments
    departments = departments[
        ~departments["code_insee"].isin(("971", "972", "973", "974", "975", "976"))
    ]
    display_df(departments)
    return departments


@log_execution(RESULT_FILEPATH)
def preprocess_cadastre_departments() -> None:
    departments = download_osm_departments_cadastre()
    departments = remove_overseas_departments(departments)
    departments = convert_crs_to_lambert93(departments)
    departments = departments[["code_insee", "nom", "geometry"]].rename(
        columns={"nom": "name"}
    )
    save_gdf(departments, RESULT_FILEPATH)
