import json
from transform import *
from load import *
from airflow import DAG
from datetime import datetime, timedelta
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.operators.dummy_operator import DummyOperator
import pandas as pd

# Questions bonnes pratiques à voir ici
s3_hook = S3Hook(aws_conn_id='aws_d4g')
with open('config/config.json', 'r') as config_file:
    config = json.load(config_file)

bucket_name = config["bucket_name"]
s3_key_metadata = config["s3_key_metadata"]
api_query = config["api_query"]
s3_key = config["s3_key"]
url = config["url"]
download_path = config["download_path"]

default_arguments = {
    "owner": "dataeng",
    'retries': 1,
    'start_date': datetime(2025, 2, 23),
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    default_args=default_arguments,
    dag_id="etl_bcr_transform",
    start_date=datetime(2025, 2, 16),
    schedule_interval='@daily'
) as etl_package_test:

    # Check extract
    is_in_local = PythonOperator(
        task_id='is_in_local',
        python_callable=is_in_local,
        op_args=[download_path],
        provide_context=True
    )

    # Extract file
    load_from_S3 = PythonOperator(
        task_id='load_from_S3',
        python_callable=load_from_S3,
        op_args=[bucket_name, s3_key, s3_hook, download_path],
        provide_context=True
    )

    def conditionally_download(**kwargs):
        load_s3 = kwargs['ti'].xcom_pull(
            task_ids='is_in_local',
            key='is_in_local'
        )

        if load_s3:
            return 'regroup_sufosat_days'
        return 'load_from_S3'

    
    condition_task = BranchPythonOperator(
        task_id='conditionally_download',
        python_callable=conditionally_download,
        provide_context=True,
    )

    regroup_sufosat_days = PythonOperator(
        task_id='regroup_sufosat_days',
        python_callable=regroup_sufosat_days,
        op_args=[
            "dags/temp_tif/mosaics_tropisco_warnings_france_date.tif",
            "dags/temp_tif/mosaics_tropisco_warnings_france_date_2024.tif",
            pd.Timestamp(year=2024, month=1, day=1),
            pd.Timestamp(year=2024, month=12, day=31),
        ],
        trigger_rule='none_failed_or_skipped' #IMPORTANT POUR LE SUITE --> no default skip
    )

    polygonize_tif = PythonOperator(
        task_id= 'polygonize_tif',
        python_callable=polygonize_tif,
    )
    
    process_geo_data = PythonOperator(
        task_id= 'process_geo_data',
        python_callable=process_geo_data,
    )

    detect_clear_cut_by_size = PythonOperator(
        task_id= 'detect_clear_cut_by_size',
        python_callable=detect_clear_cut_by_size,
    )
    
    upload_geodataframe_to_s3 = PythonOperator(
        task_id= 'upload_geodataframe_to_s3',
        python_callable=upload_geodataframe_to_s3,
        op_args=[bucket_name, s3_hook],
        provide_context=True
    )

    is_in_local >> condition_task >> [load_from_S3, regroup_sufosat_days]
    load_from_S3 >> regroup_sufosat_days >> polygonize_tif >> process_geo_data >> detect_clear_cut_by_size
    detect_clear_cut_by_size >> upload_geodataframe_to_s3 
