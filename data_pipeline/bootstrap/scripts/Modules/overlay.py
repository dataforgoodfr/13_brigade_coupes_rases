# -*- coding: utf-8 -*-
"""
Created on Sun Apr 20 13:18:04 2025

@author: cindy
"""
import geopandas as gpd
import dask_geopandas


def overlay(
    left_gdf: dask_geopandas.GeoDataFrame, right_gdf: gpd.GeoDataFrame
) -> dask_geopandas.GeoDataFrame:
    """
    Perform overlay operation between dask_geopandas and regular geopandas DataFrames.

    This custom implementation is needed since dask-geopandas doesn't provide an 'overlay' function.

    Parameters
    ----------
    left_gdf : dask_geopandas.GeoDataFrame
        Left GeoDataFrame in dask format
    right_gdf : gpd.GeoDataFrame
        Right GeoDataFrame

    Returns
    -------
    dask_geopandas.GeoDataFrame
        Result of the overlay operation
    """
    # Assign right geometry to a separate column
    right_gdf = right_gdf.assign(right_geometry=right_gdf.geometry)

    # Spatial join the GeoDataFrames (using left and right geometries)
    # dask-geopandas only supports "inner" joins
    joined_gdf = left_gdf.sjoin(right_gdf, how="inner", predicate="intersects")

    # Calculate intersection of geometries
    joined_gdf["geometry"] = joined_gdf.geometry.intersection(joined_gdf.right_geometry)

    # Drop temporary right_geometry column
    joined_gdf = joined_gdf.set_geometry(col="geometry").drop(columns="right_geometry")

    return joined_gdf
