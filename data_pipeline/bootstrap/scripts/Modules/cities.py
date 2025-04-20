# -*- coding: utf-8 -*-
"""
Created on Sun Apr 20 11:58:18 2025

@author: cindy
"""
import gzip
import logging
import shutil

import dask_geopandas
import geopandas as gpd

from scripts import DATA_DIR
from scripts.utils import display_df, download_file, load_gdf
from enrich_sufosat_clusters import overlay

CADASTRE_CITIES_DIR = DATA_DIR / "cadastre_cities"
RESULT_FILEPATH = CADASTRE_CITIES_DIR / "cadastre_cities.fgb"
ENRICHED_CLUSTERS_RESULT_FILEPATH = DATA_DIR / "sufosat/sufosat_clusters_enriched.fgb"


def enrich_with_cities(
    sufosat: gpd.GeoDataFrame, sufosat_dask: dask_geopandas.GeoDataFrame
) -> gpd.GeoDataFrame:
    logging.info("Enriching SUFOSAT clusters with the list of intersecting city INSEE codes")

    # Load cities data
    logging.info("Loading cities data")
    cadastre_cities = load_gdf(DATA_DIR / "cadastre_cities/cadastre_cities.fgb")

    # Find cities that intersect with clear-cut clusters
    cities = (
        overlay(sufosat_dask, cadastre_cities)
        .groupby("clear_cut_group")["code_insee"]
        .agg(list)
        .compute()
    )

    # Add cities to the SUFOSAT DataFrame
    sufosat.loc[cities.index, "cities"] = cities
    missing_cities_count = sufosat["cities"].isna().sum()
    logging.info(f"{missing_cities_count} clear-cut clusters don't intersect with any city")

    # Handle clear-cuts that don't fall within any city polygon
    # by joining with their nearest cities
    if missing_cities_count > 0:
        logging.info("Finding nearest cities for clusters without city intersection")
        clear_cuts_with_nearest_cities = (
            sufosat[sufosat["cities"].isna()]
            .sjoin_nearest(cadastre_cities)
            .groupby("clear_cut_group")["code_insee"]
            .agg(list)
        )

        sufosat.loc[clear_cuts_with_nearest_cities.index, "cities"] = (
            clear_cuts_with_nearest_cities
        )
        logging.info(
            f"{sufosat['cities'].isna().sum()} clusters remain without city information"
        )

    display_df(sufosat)

    return sufosat


def download_etalab_cities_cadastre() -> gpd.GeoDataFrame:
    logging.info("Downloading the Etalab cadastre for cities")

    # See https://cadastre.data.gouv.fr/datasets/cadastre-etalab
    download_file(
        "https://cadastre.data.gouv.fr/data/etalab-cadastre/2025-01-01/geojson/france/cadastre-france-communes.json.gz",
        CADASTRE_CITIES_DIR / "cadastre-france-communes.json.gz",
    )

    logging.info("Unzipping the gzipped json")
    with gzip.open(CADASTRE_CITIES_DIR / "cadastre-france-communes.json.gz", "rb") as f_in:
        with open(CADASTRE_CITIES_DIR / "cadastre-france-communes.json", "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)

    cities = load_gdf(CADASTRE_CITIES_DIR / "cadastre-france-communes.json")

    return cities


def remove_overseas_cities(cities: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info("Removing the overseas cities")
    # Remove the overseas cities
    cities = cities[~cities["id"].str.startswith(("971", "972", "973", "974", "975", "976"))]
    display_df(cities)
    return cities


def convert_crs_to_lambert93(cities: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info("Convert CRS to Lambert93 like the other project layers")
    cities = cities.to_crs(epsg=2154)
    return cities
