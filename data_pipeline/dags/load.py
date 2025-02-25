import io
import logging
import geopandas as gpd


# Import des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# QUALITY CHECK --> Paulette

# Load files in S3
def upload_geodataframe_to_s3(bucket_name, s3_hook, **kwargs):
    key = "dataeng/to_api/clear_cut_processed.geojson"

    # Vérifier si le fichier existe déjà sur S3
    existing_files = s3_hook.list_keys(bucket_name, prefix=key)
    
    if existing_files and key in existing_files:
        try:
            s3_hook.delete_objects(bucket=bucket_name, keys=[key])
            logger.info(f"🗑️ Fichier {key} supprimé de S3 avant chargement.")
        except Exception as e:
            logger.warning(f"⚠️ Impossible de supprimer {key} de S3. Erreur : {e}")

    # Récupération des données GeoJSON depuis XCom
    gdata = gpd.read_file(kwargs['ti'].xcom_pull(task_ids='detect_clear_cut_by_size', key='new_clear_cut'))
    gdata_str = gdata.to_json()

    # Chargement du fichier sur S3
    s3_hook.load_string(
        string_data=gdata_str, 
        bucket_name=bucket_name, 
        key=key
    )

    logger.info(f"✅ Fichier {key} uploadé sur S3")

# Load to Postgres --> Attendre l'équipe backend
# def load_postgres() 
