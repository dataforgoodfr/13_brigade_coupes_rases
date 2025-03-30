import gzip
import logging
import shutil

import geopandas as gpd

from scripts import DATA_DIR
from scripts.utils import display_df, download_file, load_gdf, log_execution, save_gdf

CADASTRE_CITIES_DIR = DATA_DIR / "cadastre_cities"
RESULT_FILEPATH = CADASTRE_CITIES_DIR / "cadastre_cities.fgb"


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


@log_execution(RESULT_FILEPATH)
def preprocess_cadastre_cities() -> None:
    cities = download_etalab_cities_cadastre()
    cities = remove_overseas_cities(cities)
    cities = convert_crs_to_lambert93(cities)
    cities = cities[["id", "nom", "geometry"]].rename(
        columns={"id": "code_insee", "nom": "name"}
    )
    save_gdf(cities, RESULT_FILEPATH)


if __name__ == "__main__":
    preprocess_cadastre_cities()
