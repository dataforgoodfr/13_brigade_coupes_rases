# -*- coding: utf-8 -*-
"""
Created on Sat Apr 12 20:20:22 2025

@author: cindy
"""

import logging

import geopandas as gpd

from scripts.utils import display_df, download_file, load_gdf


def download_file_module(url, output_dir) -> None:
    logging.info("Starting download")
    download_file(url, output_dir)
    logging.info("Download complete")
    return


def load_layers(input_dir) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    logging.info("Loading the layers")
    load = load_gdf(input_dir)
    logging.info("Loaded successfully")
    return load


def union_module(input_file: gpd.GeoDataFrame, crs) -> gpd.GeoDataFrame:
    logging.info("Starts unioning")
    union = gpd.GeoDataFrame(
        geometry=[input_file.union_all()], crs=crs
    )
    display_df(union)
    return union

