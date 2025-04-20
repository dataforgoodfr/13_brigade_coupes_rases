import logging
from pathlib import Path

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
        logging.info(
            f"Download completed: {output_filepath} (Size: {file_size_mb:.2f} MB)"
        )
