# -*- coding: utf-8 -*-
"""
Created on Sun Apr 20 13:53:56 2025

@author: cindy
"""
import logging

import geopandas as gpd

def convert_crs_to_lambert93(obj: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info("Convert CRS to Lambert93 like the other project layers")
    obj = obj.to_crs(epsg=2154)
    return obj