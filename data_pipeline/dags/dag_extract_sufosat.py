import json
from extract import *
from airflow import DAG
from datetime import datetime, timedelta
from airflow.operators.python import PythonOperator
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.operators.python import BranchPythonOperator
from airflow.operators.dummy_operator import DummyOperator


# # # # # # # # # # # # 
# FICHIER DES CONFIGS
# # # # # # # # # # # # 

s3_hook = S3Hook(aws_conn_id='aws_d4g')
with open('config/config.json', 'r') as config_file:
    config = json.load(config_file)

bucket_name = config["bucket_name"]
s3_key_metadata = config["s3_key_metadata"]
api_query = config["api_query"]
s3_key = config["s3_key"]
url = config["url"]


# Définition du DAG
with DAG(
    dag_id='etl_bcr_extract_sufosat',
    default_args={
        'owner': 'dataeng',
        'retries': 1,
        'start_date': datetime(2025, 2, 23),
    },
    schedule_interval='@daily',  
    catchup=False,
) as dag:
    
    file_in_s3 = PythonOperator(
        task_id='file_in_s3',
        python_callable=check_tif_in_s3,
        op_args=[bucket_name, s3_key, s3_hook],
        provide_context=True
    )

    # Tâche de mise à jour (vérification et condition)
    update_task = PythonOperator(
        task_id='data_update',
        python_callable=data_update,
        op_args=[api_query, bucket_name, s3_key_metadata, s3_hook],
        provide_context=True,
    )

    # Tâche d'extraction et de téléchargement des données
    extract_task = PythonOperator(
        task_id='extract_tif_data_and_upload',
        python_callable=extract_tif_data_and_upload,
        op_args=[url, s3_key, bucket_name, s3_hook],
        provide_context=True,
    )
   
    # Tâche d'extraction et de téléchargement des données
    update_metadata = PythonOperator(
        task_id='update_metadata',
        python_callable=update_metadata,
        op_args=[bucket_name, s3_key_metadata, s3_hook],
        provide_context=True,
    )

    # Contrôle de l'exécution de extract_task basé sur do_update
    def conditionally_run_extract(**kwargs):
        do_update = kwargs['ti'].xcom_pull(task_ids='data_update', key='do_update')
        in_s3 = kwargs['ti'].xcom_pull(task_ids='file_in_s3', key='not_in_s3')


        if not do_update and not in_s3:
            return 'skip_task'
        return 'extract_tif_data_and_upload'


    # Ajouter un opérateur Dummy pour ignorer si aucune mise à jour n'est requise
    skip_task = DummyOperator(task_id='skip_task')

    # Modification du flux pour inclure la logique conditionnelle
    condition_task = BranchPythonOperator(
        task_id='conditionally_run_extract',
        python_callable=conditionally_run_extract,
        provide_context=True,
    )

    [file_in_s3, update_task] >> condition_task >> [extract_task, skip_task] 
    extract_task >> update_metadata
