import os
import fiona
import rasterio
import numpy as np
from tqdm import tqdm
from rasterio.features import shapes
from utils.logging_etl import etl_logger


class Polygonizer:
    def __init__(self):
        self.logger = etl_logger("logs/transform.log")

    def filter_raster_by_date(
        self, input_tif_filepath, output_tif_filepath, start_date, end_date
    ):
        """
        Filters a raster image by date range.

        This function reads a raster file, filters its pixel values to retain only those
        within a specified date range, and writes the filtered data to a new raster file.

        Parameters
        ----------
        input_tif_filepath : str
            Path to the input raster file.
        output_tif_filepath : str
            Path to the output raster file where the filtered data will be saved.
        start_date : int
            The minimum date value (inclusive) for filtering pixel values.
        end_date : int
            The maximum date value (inclusive) for filtering pixel values.

        Returns
        -------
        None
            The function saves the filtered raster to the specified output file.
        """
        with rasterio.open(input_tif_filepath) as src:
            # Preserve original metadata
            profile = src.profile.copy()

            # Create output file with same profile
            with rasterio.open(output_tif_filepath, "w", **profile) as dst:
                # Get the optimal window size for reading blocks
                # This uses rasterio's built-in windowing to avoid loading the whole dataset
                windows = list(src.block_windows())
                # total_windows = len(windows)

                # Process each window/block separately
                for idx, (window_idx, window) in enumerate(
                    tqdm(windows, desc="Processing blocks", unit="block")
                ):
                    # Read only the current window data
                    data = src.read(1, window=window)

                    # Apply filter on this window
                    mask = (data >= start_date) & (data <= end_date)
                    filtered_data = np.where(mask, data, 0)

                    # Write processed window to output
                    dst.write(filtered_data, 1, window=window)

        self.logger.info("✅ Raster data filtered by date range")

    def polygonize_tif(self, raster_path, vector_path):
        """
        Polygonize a large GeoTIFF using a chunked approach to manage memory usage.

        This function converts raster data from a GeoTIFF file into vector polygons
        and saves the output as a shapefile. It processes the raster in chunks to
        handle large files efficiently.

        Parameters
        ----------
        raster_path : str
            Path to the input GeoTIFF file.
        vector_path : str
            Path to the output shapefile where the vectorized polygons will be saved.

        Returns
        -------
        None
        The function saves the vectorized polygons to the specified shapefile.
        """
        os.makedirs(os.path.dirname(vector_path), exist_ok=True)

        # Define Fiona schema
        schema = {"geometry": "Polygon", "properties": {"DN": "int"}}

        # Open raster to get metadata
        with rasterio.open(raster_path) as src:
            self.logger.info("✅ Raster opened with Rasterio")
            crs = src.crs
            transform = src.transform

            # Create output shapefile
            if os.path.exists(vector_path):
                os.remove(vector_path)

            with fiona.open(
                vector_path,
                "w",
                driver="ESRI Shapefile",
                schema=schema,
                crs=crs.to_dict(),
            ) as shp:
                # Process in chunks using block windows
                windows = list(src.block_windows())
                # total_windows = len(windows)

                for idx, (window_idx, window) in enumerate(
                    tqdm(windows, desc="Polygonizing blocks", unit="block")
                ):
                    # Read only the data for this window
                    band = src.read(1, window=window)

                    # Skip window if it's all zeros
                    if not np.any(band):
                        continue

                    # Create a window-specific transform
                    window_transform = rasterio.windows.transform(window, transform)
                    mask = band != 0

                    # Polygonize this window
                    window_polygons = (
                        {"properties": {"DN": int(value)}, "geometry": geom}
                        for geom, value in shapes(band, mask=mask, transform=window_transform)
                    )

                    # Write window polygons to shapefile
                    for feature in window_polygons:
                        shp.write(feature)

        self.logger.info("✅ Shapefile created")
        self.logger.info("✅ Polygonization successful")
