import logging
import os

import geopandas as gpd
import pandas as pd
import py7zr
from tqdm import tqdm

from bootstrap.scripts import DATA_DIR
from bootstrap.scripts.utils import display_df, download_file, log_execution, save_gdf

BDFORET_DIR = DATA_DIR / "bdforet"
RESULT_FILEPATH = BDFORET_DIR / "bdforet.fgb"


def download_bdforet_departments() -> None:
    logging.info("Download the BDFORET shapefiles for every department")
    # See https://geoservices.ign.fr/bdforet#telechargementv2
    urls_to_download = [
        "https://data.geopf.fr/telechargement/download/BDFORET/BDFORET_2-0__SHP_LAMB93_"
        + filename
        for filename in [
            "D001_2014-04-01/BDFORET_2-0__SHP_LAMB93_D001_2014-04-01.7z",
            "D002_2017-10-04/BDFORET_2-0__SHP_LAMB93_D002_2017-10-04.7z",
            "D003_2014-04-01/BDFORET_2-0__SHP_LAMB93_D003_2014-04-01.7z",
            "D004_2014-04-01/BDFORET_2-0__SHP_LAMB93_D004_2014-04-01.7z",
            "D005_2015-04-01/BDFORET_2-0__SHP_LAMB93_D005_2015-04-01.7z",
            "D006_2021-03-01/BDFORET_2-0__SHP_LAMB93_D006_2021-03-01.7z",
            "D007_2014-04-01/BDFORET_2-0__SHP_LAMB93_D007_2014-04-01.7z",
            "D008_2022-04-01/BDFORET_2-0__SHP_LAMB93_D008_2022-04-01.7z",
            "D009_2017-10-04/BDFORET_2-0__SHP_LAMB93_D009_2017-10-04.7z",
            "D010_2021-03-01/BDFORET_2-0__SHP_LAMB93_D010_2021-03-01.7z",
            "D011_2018-11-20/BDFORET_2-0__SHP_LAMB93_D011_2018-11-20.7z",
            "D012_2014-04-01/BDFORET_2-0__SHP_LAMB93_D012_2014-04-01.7z",
            "D013_2014-04-01/BDFORET_2-0__SHP_LAMB93_D013_2014-04-01.7z",
            "D014_2014-04-01/BDFORET_2-0__SHP_LAMB93_D014_2014-04-01.7z",
            "D015_2015-04-01/BDFORET_2-0__SHP_LAMB93_D015_2015-04-01.7z",
            "D016_2018-01-15/BDFORET_2-0__SHP_LAMB93_D016_2018-01-15.7z",
            "D017_2017-10-04/BDFORET_2-0__SHP_LAMB93_D017_2017-10-04.7z",
            "D018_2014-04-01/BDFORET_2-0__SHP_LAMB93_D018_2014-04-01.7z",
            "D019_2016-02-16/BDFORET_2-0__SHP_LAMB93_D019_2016-02-16.7z",
            "D02A_2017-05-10/BDFORET_2-0__SHP_LAMB93_D02A_2017-05-10.7z",
            "D02B_2016-02-16/BDFORET_2-0__SHP_LAMB93_D02B_2016-02-16.7z",
            "D021_2017-10-04/BDFORET_2-0__SHP_LAMB93_D021_2017-10-04.7z",
            "D022_2018-10-01/BDFORET_2-0__SHP_LAMB93_D022_2018-10-01.7z",
            "D023_2017-05-10/BDFORET_2-0__SHP_LAMB93_D023_2017-05-10.7z",
            "D024_2019-01-09/BDFORET_2-0__SHP_LAMB93_D024_2019-01-09.7z",
            "D025_2016-02-16/BDFORET_2-0__SHP_LAMB93_D025_2016-02-16.7z",
            "D026_2014-04-01/BDFORET_2-0__SHP_LAMB93_D026_2014-04-01.7z",
            "D027_2014-04-01/BDFORET_2-0__SHP_LAMB93_D027_2014-04-01.7z",
            "D028_2017-05-10/BDFORET_2-0__SHP_LAMB93_D028_2017-05-10.7z",
            "D029_2014-04-01/BDFORET_2-0__SHP_LAMB93_D029_2014-04-01.7z",
            "D030_2018-11-20/BDFORET_2-0__SHP_LAMB93_D030_2018-11-20.7z",
            "D031_2019-01-09/BDFORET_2-0__SHP_LAMB93_D031_2019-01-09.7z",
            "D032_2015-04-01/BDFORET_2-0__SHP_LAMB93_D032_2015-04-01.7z",
            "D033_2017-05-10/BDFORET_2-0__SHP_LAMB93_D033_2017-05-10.7z",
            "D034_2018-01-15/BDFORET_2-0__SHP_LAMB93_D034_2018-01-15.7z",
            "D035_2018-10-01/BDFORET_2-0__SHP_LAMB93_D035_2018-10-01.7z",
            "D036_2021-03-01/BDFORET_2-0__SHP_LAMB93_D036_2021-03-01.7z",
            "D037_2017-05-10/BDFORET_2-0__SHP_LAMB93_D037_2017-05-10.7z",
            "D038_2014-04-01/BDFORET_2-0__SHP_LAMB93_D038_2014-04-01.7z",
            "D039_2016-02-16/BDFORET_2-0__SHP_LAMB93_D039_2016-02-16.7z",
            "D040_2018-10-01/BDFORET_2-0__SHP_LAMB93_D040_2018-10-01.7z",
            "D041_2017-05-10/BDFORET_2-0__SHP_LAMB93_D041_2017-05-10.7z",
            "D042_2014-04-01/BDFORET_2-0__SHP_LAMB93_D042_2014-04-01.7z",
            "D043_2021-11-15/BDFORET_2-0__SHP_LAMB93_D043_2021-11-15.7z",
            "D044_2018-10-01/BDFORET_2-0__SHP_LAMB93_D044_2018-10-01.7z",
            "D045_2015-04-01/BDFORET_2-0__SHP_LAMB93_D045_2015-04-01.7z",
            "D046_2017-05-10/BDFORET_2-0__SHP_LAMB93_D046_2017-05-10.7z",
            "D047_2018-10-01/BDFORET_2-0__SHP_LAMB93_D047_2018-10-01.7z",
            "D048_2017-05-10/BDFORET_2-0__SHP_LAMB93_D048_2017-05-10.7z",
            "D049_2018-10-01/BDFORET_2-0__SHP_LAMB93_D049_2018-10-01.7z",
            "D050_2018-10-01/BDFORET_2-0__SHP_LAMB93_D050_2018-10-01.7z",
            "D051_2021-03-01/BDFORET_2-0__SHP_LAMB93_D051_2021-03-01.7z",
            "D052_2014-04-01/BDFORET_2-0__SHP_LAMB93_D052_2014-04-01.7z",
            "D053_2018-10-01/BDFORET_2-0__SHP_LAMB93_D053_2018-10-01.7z",
            "D054_2014-04-01/BDFORET_2-0__SHP_LAMB93_D054_2014-04-01.7z",
            "D055_2015-04-01/BDFORET_2-0__SHP_LAMB93_D055_2015-04-01.7z",
            "D056_2021-03-01/BDFORET_2-0__SHP_LAMB93_D056_2021-03-01.7z",
            "D057_2014-04-01/BDFORET_2-0__SHP_LAMB93_D057_2014-04-01.7z",
            "D058_2014-04-01/BDFORET_2-0__SHP_LAMB93_D058_2014-04-01.7z",
            "D059_2014-04-01/BDFORET_2-0__SHP_LAMB93_D059_2014-04-01.7z",
            "D060_2015-04-01/BDFORET_2-0__SHP_LAMB93_D060_2015-04-01.7z",
            "D061_2014-04-01/BDFORET_2-0__SHP_LAMB93_D061_2014-04-01.7z",
            "D062_2014-04-01/BDFORET_2-0__SHP_LAMB93_D062_2014-04-01.7z",
            "D063_2014-04-01/BDFORET_2-0__SHP_LAMB93_D063_2014-04-01.7z",
            "D064_2014-04-01/BDFORET_2-0__SHP_LAMB93_D064_2014-04-01.7z",
            "D065_2014-04-01/BDFORET_2-0__SHP_LAMB93_D065_2014-04-01.7z",
            "D066_2018-11-20/BDFORET_2-0__SHP_LAMB93_D066_2018-11-20.7z",
            "D067_2014-04-01/BDFORET_2-0__SHP_LAMB93_D067_2014-04-01.7z",
            "D068_2014-04-01/BDFORET_2-0__SHP_LAMB93_D068_2014-04-01.7z",
            "D069_2014-04-01/BDFORET_2-0__SHP_LAMB93_D069_2014-04-01.7z",
            "D070_2015-06-01/BDFORET_2-0__SHP_LAMB93_D070_2015-06-01.7z",
            "D071_2018-11-20/BDFORET_2-0__SHP_LAMB93_D071_2018-11-20.7z",
            "D072_2022-04-01/BDFORET_2-0__SHP_LAMB93_D072_2022-04-01.7z",
            "D073_2014-04-01/BDFORET_2-0__SHP_LAMB93_D073_2014-04-01.7z",
            "D074_2014-04-01/BDFORET_2-0__SHP_LAMB93_D074_2014-04-01.7z",
            "D075_2018-01-15/BDFORET_2-0__SHP_LAMB93_D075_2018-01-15.7z",
            "D076_2015-06-01/BDFORET_2-0__SHP_LAMB93_D076_2015-06-01.7z",
            "D077_2017-10-04/BDFORET_2-0__SHP_LAMB93_D077_2017-10-04.7z",
            "D078_2019-01-09/BDFORET_2-0__SHP_LAMB93_D078_2019-01-09.7z",
            "D079_2014-04-01/BDFORET_2-0__SHP_LAMB93_D079_2014-04-01.7z",
            "D080_2015-04-01/BDFORET_2-0__SHP_LAMB93_D080_2015-04-01.7z",
            "D081_2014-04-01/BDFORET_2-0__SHP_LAMB93_D081_2014-04-01.7z",
            "D082_2017-10-04/BDFORET_2-0__SHP_LAMB93_D082_2017-10-04.7z",
            "D083_2015-04-01/BDFORET_2-0__SHP_LAMB93_D083_2015-04-01.7z",
            "D084_2022-04-01/BDFORET_2-0__SHP_LAMB93_D084_2022-04-01.7z",
            "D085_2014-04-01/BDFORET_2-0__SHP_LAMB93_D085_2014-04-01.7z",
            "D086_2014-04-01/BDFORET_2-0__SHP_LAMB93_D086_2014-04-01.7z",
            "D087_2016-02-16/BDFORET_2-0__SHP_LAMB93_D087_2016-02-16.7z",
            "D088_2015-04-01/BDFORET_2-0__SHP_LAMB93_D088_2015-04-01.7z",
            "D089_2014-04-01/BDFORET_2-0__SHP_LAMB93_D089_2014-04-01.7z",
            "D090_2015-06-01/BDFORET_2-0__SHP_LAMB93_D090_2015-06-01.7z",
            "D091_2018-01-15/BDFORET_2-0__SHP_LAMB93_D091_2018-01-15.7z",
            "D092_2018-01-15/BDFORET_2-0__SHP_LAMB93_D092_2018-01-15.7z",
            "D093_2018-01-15/BDFORET_2-0__SHP_LAMB93_D093_2018-01-15.7z",
            "D094_2017-10-04/BDFORET_2-0__SHP_LAMB93_D094_2017-10-04.7z",
            "D095_2015-04-01/BDFORET_2-0__SHP_LAMB93_D095_2015-04-01.7z",
        ]
    ]

    archives_dir = BDFORET_DIR / "archives"
    for url in tqdm(
        urls_to_download, desc="Downloading the tiles of all the mainland French departments"
    ):
        filename = url.split("/")[-1]
        filepath = archives_dir / filename
        download_file(url, filepath)


def decompress_bdforet_departments() -> None:
    logging.info("Decompress the BDFORET archives")

    compressed_dir = BDFORET_DIR / "archives"
    uncompressed_dir = BDFORET_DIR / "uncompressed"

    for archive_filename in tqdm(
        sorted(os.listdir(compressed_dir)),
        desc="Uncompressing the BDFORET departments shapefiles .7z files",
    ):
        # Extract the shapefiles files
        with py7zr.SevenZipFile(compressed_dir / archive_filename) as archive:
            shapefile_filepaths = [f for f in archive.getnames() if "FORMATION_VEGETALE" in f]
            archive.extract(targets=shapefile_filepaths, path=uncompressed_dir)


def load_bdforet() -> gpd.GeoDataFrame:
    logging.info("Load the BDFORET GeoDataFrame")

    # Load the geodataframes for every department
    gdf_list: list[gpd.GeoDataFrame] = []
    for f in tqdm(os.listdir(BDFORET_DIR / "uncompressed")):
        filepath = (
            BDFORET_DIR
            / "uncompressed"
            / f
            / "BDFORET/1_DONNEES_LIVRAISON"
            / f"BDF_2-0_SHP_LAMB93_{f.split('_')[-2]}"
        )
        df = gpd.read_file(filepath)[["ID", "TFV_G11", "geometry"]]
        gdf_list.append(df)

    # Create the geodataframe for all the departments
    bdforet = pd.concat(gdf_list)
    bdforet = gpd.GeoDataFrame(bdforet)

    # Remove duplicated geometries that span multiple departments
    bdforet = bdforet.drop_duplicates("ID").copy()

    display_df(bdforet)

    return bdforet


def simplify_and_filter_bdforet_types(bdforet: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    logging.info(
        "Simplify the BDFORET types and keep the ones that are interesting for clear-cut detection"
    )

    # Simplify the types
    # See documentation here: https://inventaire-forestier.ign.fr/IMG/pdf/DC_BDFORET_v2.pdf
    bdforet["bdf_type"] = (
        bdforet["TFV_G11"]
        .replace(
            {
                "Forêt fermée feuillus": "deciduous",
                "Forêt ouverte feuillus": "deciduous",
                "Forêt fermée conifères": "resinous",
                "Forêt ouverte conifères": "resinous",
                "Forêt fermée mixte": "mixed",
                "Forêt ouverte mixte": "mixed",
                "Peupleraie": "poplar",
                # Ignored since it's not relevant for detecting the clear-cuts essence
                # We can label it as "other" or "unknown" or something alike in the frontend
                # - Lande
                # - Formation herbacée
                # - Forêt fermée sans couvert arboré
                # - Forêt ouverte sans couvert arboré
            }
        )
        .astype("category")
    )

    # Keep relevant types
    bdforet = bdforet[bdforet["bdf_type"].isin(["deciduous", "resinous", "mixed", "poplar"])]

    # Keep relevant columns
    bdforet = bdforet[["bdf_type", "geometry"]]

    display_df(bdforet)

    return bdforet


@log_execution(RESULT_FILEPATH)
def preprocess_bdforet() -> None:
    download_bdforet_departments()
    decompress_bdforet_departments()
    bdforet = load_bdforet()
    bdforet = simplify_and_filter_bdforet_types(bdforet)
    save_gdf(bdforet, RESULT_FILEPATH)


if __name__ == "__main__":
    preprocess_bdforet()
