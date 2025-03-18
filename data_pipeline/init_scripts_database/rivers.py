import os

import geopandas as gpd
import yaml
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from utils.download import decompress_zip, download_file
from utils.logger import init_db_logger
from utils.s3 import S3Manager

# Configuration


load_dotenv()

## Logger
logger = init_db_logger("./logs/main.log")

## Chargement des paramètres
with open("./config/config.yaml") as stream:
    configs = yaml.safe_load(stream)

## S3 Manager
s3_manager = S3Manager()

## Connexion à la base de données
engine = create_engine(
    f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

# Définition des chemins de fichiers
download_path = configs["download_path"]
s3_prefix = configs["rivers"]["s3_prefix"]
s3_filename = configs["rivers"]["s3_filename"]
local_file_path = os.path.join(download_path, s3_filename)
geojson_zip_path = os.path.join(download_path, "CoursEau_geojson.zip")
geojson_path = os.path.join(download_path, "CoursEau_FXX.geojson")
geoparquet_path = os.path.join(download_path, "CoursEau.geoparquet")


def load_data_from_s3():
    """Télécharge et charge les données depuis S3."""
    logger.info("✅ Téléchargement du fichier déjà présent dans S3")
    s3_manager.download_from_s3(
        s3_key=os.path.join(s3_prefix, s3_filename),
        download_path=local_file_path,
    )
    return gpd.read_parquet(local_file_path).set_geometry("geom")


def download_and_process_data():
    """Télécharge, transforme et enregistre les données."""
    logger.info("✅ Téléchargement du fichier depuis la source")
    download_file(configs["rivers"]["download_url"], filename=geojson_zip_path)

    logger.info("✅ Décompression du fichier")
    decompress_zip(input_file=geojson_zip_path, output_file=download_path)

    logger.info("✅ Processing du fichier")
    data = (
        gpd.read_file(geojson_path)
        .rename(columns={"geometry": "geom"})
        .set_geometry("geom")
        .to_crs("epsg:4326")
    )

    data.to_parquet(geoparquet_path)

    return data


def write_to_database(data):
    """Écrit les données dans la base PostgreSQL."""
    logger.info("✅ Écriture des données dans la base de données")
    data.to_postgis("rivers", engine, if_exists="replace", chunksize=5000)


if __name__ == "__main__":
    logger.info("🚀 Démarrage du script rivière")

    try:
        # Vérifie si le fichier est dans S3 et charge les données
        if s3_manager.file_check(s3_prefix, s3_filename):
            logger.info("✅ Le fichier est dans S3")
            data = load_data_from_s3()
        else:
            logger.info("✅ Le fichier n'est pas dans S3")
            data = download_and_process_data()

            logger.info("✅ Export vers S3")

            """
            s3_manager.upload_to_s3(
                s3_key=os.path.join(s3_prefix, s3_filename),
                file_path=geoparquet_path,
            )
            """

        final_data = data[["CdOH", "TopoOH", "geom"]].rename(
            {"CdOH": "Id_river", "TopoOH": "Name_river"}
        )

        # Écriture dans la base de données
        write_to_database(final_data)

        # Indexing spatial sur les géometries
        with engine.connect() as conn:
            query = text("""
                CREATE INDEX rivers_geom_idx ON rivers USING GIST (geom);
            """)

            result = conn.execute(query)

        logger.info("✅ Fin du pipeline")

    except Exception as e:
        logger.error(f"❌ Erreur dans le pipeline: {str(e)}", exc_info=True)
