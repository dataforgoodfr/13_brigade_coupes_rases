import functools
import inspect
import logging
import math
import os
import sys
import time
from pathlib import Path

import geopandas as gpd
import pandas as pd
import psutil
import requests


def download_file(url: str, output_filepath: str | Path) -> None:
    # Convert to Path
    if isinstance(output_filepath, str):
        output_filepath = Path(output_filepath)

    # Create output folder if it doesn't exist yet
    output_filepath.parent.mkdir(exist_ok=True, parents=True)

    if output_filepath.exists():
        # Don't download the file if it already exists
        file_size_mb = output_filepath.stat().st_size / (1024 * 1024)
        logging.info(
            f"The {output_filepath} file already exists (Size: {file_size_mb:.2f} MB), skipping the download of the {url} url"
        )
    else:
        logging.info(f"Downloading {url} to {output_filepath}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an error for bad responses (4xx and 5xx)

        with open(output_filepath, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)

        file_size_mb = output_filepath.stat().st_size / (1024 * 1024)
        logging.info(f"Download completed: {output_filepath} (Size: {file_size_mb:.2f} MB)")


def display_df(df: pd.DataFrame) -> None:
    # Calculate memory usage in bytes
    memory_usage = df.memory_usage(deep=True).sum()

    # Convert bytes to MB
    memory_usage_mb = memory_usage / (1024**2)

    # Log the data preview and memory usage in MB
    logging.info(
        f"Data preview (Memory usage: {memory_usage_mb:.2f} MB):\n"
        + df.to_string(max_rows=10, max_colwidth=50, show_dimensions=True)
    )


def load_gdf(input_filepath: str | Path) -> gpd.GeoDataFrame:
    logging.info(f"Loading {input_filepath} as a gpd.GeoDataFrame...")
    gdf = gpd.read_file(input_filepath)
    logging.info(f"Coordinate Reference System (CRS) of the GeoDataFrame: {gdf.crs}")
    display_df(gdf)
    return gdf


def _format_time(timespan: float, precision: int = 3) -> str:
    """
    Formats the timespan in a human readable form.
    Code copied from IPython.core.magics.execution._format_time
    """

    if timespan >= 60.0:
        # we have more than a minute, format that in a human readable form
        # Idea from http://snipplr.com/view/5713/
        parts = [("d", 60 * 60 * 24), ("h", 60 * 60), ("min", 60), ("s", 1)]
        time = []
        leftover = timespan
        for suffix, length in parts:
            value = int(leftover / length)
            if value > 0:
                leftover = leftover % length
                time.append("%s%s" % (str(value), suffix))
            if leftover < 1:
                break
        return " ".join(time)

    # Unfortunately characters outside of range(128) can cause problems in
    # certain terminals.
    # See bug: https://bugs.launchpad.net/ipython/+bug/348466
    # Try to prevent crashes by being more secure than it needs to
    # E.g. eclipse is able to print a µ, but has no sys.stdout.encoding set.
    units = ["s", "ms", "us", "ns"]  # the safe value
    if hasattr(sys.stdout, "encoding") and sys.stdout.encoding:
        try:
            "μ".encode(sys.stdout.encoding)
            units = ["s", "ms", "μs", "ns"]
        except Exception:
            pass
    scaling = [1, 1e3, 1e6, 1e9]

    if timespan > 0.0:
        order = min(-int(math.floor(math.log10(timespan)) // 3), 3)
    else:
        order = 3
    return "%.*g %s" % (precision, timespan * scaling[order], units[order])


def log_execution(func):
    """
    Decorator for logging start, end, memory usage, and duration
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Get the script filename
        caller_frame = inspect.stack()[1]
        caller_script = os.path.basename(caller_frame.filename)

        # Log start time and message
        logging.info(f"[============  Start of the {caller_script} script ============]")

        # Record start time
        start_time = time.perf_counter()

        # Execute the function
        result = func(*args, **kwargs)

        # Record end time
        end_time = time.perf_counter()

        # Memory usage
        process = psutil.Process()
        memory_info = process.memory_info()
        max_memory = memory_info.rss / (1024 * 1024)  # Convert to MB

        # Log end time, memory usage, and duration
        logging.info(
            f"[============  End of the Natura 2000 script. "
            f"Max memory usage: {max_memory:,.0f} MB. "
            f"Total duration: {_format_time(end_time - start_time)} ============]"
        )

        return result

    return wrapper
