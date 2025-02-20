import os
import requests
from airflow import DAG
from dotenv import load_dotenv
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.operators.python import PythonOperator
from datetime import timedelta, datetime

# Charger les variables d'environnement
load_dotenv(".env")

# Variables
bucket_name = "brc-poc-etl"
s3_key = "raw_data/raster/sufosat_data/mosaics_tropisco_warnings_france_date.tif"
url = "https://zenodo.org/records/13685177/files/mosaics_tropisco_warnings_france_date.tif?download=1"

# Configurer S3Hook
s3_hook = S3Hook(aws_conn_id='aws_default')

# Définir la fonction pour l'extraction et l'upload des fichiers TIF
def extract_tif_data_and_upload(url: str, s3_key: str):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        # Utiliser S3Hook pour uploader le fichier
        s3_hook.load_file_obj(r.raw, s3_key, bucket_name)
    print(f"✅ Fichier uploadé avec succès sur S3: {s3_key}")


# Arguments par défaut
default_args = {
    'owner': 'dataeng',
    'depends_on_past': False,
    'start_date': datetime(2025, 2, 20),
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Création du DAG
dag = DAG(
    'upload_extracted_tif_to_s3',
    default_args=default_args,
    description='A simple DAG to upload extracted TIF files to S3 storage and verify the upload',
    schedule_interval=timedelta(days=1),
)

# Tâche 1 : Télécharger et uploader le fichier TIF sur S3
upload_tif_task = PythonOperator(
    task_id='extract_and_upload_tif',
    python_callable=extract_tif_data_and_upload,
    op_args=[url, s3_key],
    dag=dag,
)

# Définir l'ordre des tâches (upload puis vérification)
upload_tif_task
