from load import *
import pandas as pd
from extract import *
from transform import *
from airflow import DAG
from airflow.models import Variable
from datetime import datetime, timedelta
from airflow.utils.task_group import TaskGroup
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.operators.python import BranchPythonOperator
from airflow.operators.empty import EmptyOperator 
from airflow.operators.dummy_operator import DummyOperator


# # # # # # # # # # # # # # # # # # # # 
# Get S3 credentials and file config  #
# # # # # # # # # # # # # # # # # # # # 
s3_hook = S3Hook(aws_conn_id="aws_d4g")

url = Variable.get("url")
bucket_name = Variable.get("bucket_name")
download_path = Variable.get("download_path")
s3_key = Variable.get("s3_sufosat_file_path_raster")
api_query_file_name = Variable.get("api_query_file_name")
s3_key_metadata = Variable.get("s3_sufosat_file_path_metadata")

# # # # # # # # # # #
# Defining DAG args #
# # # # # # # # # # #
dag_args =  {
    "owner": "dataeng",
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
    "start_date": datetime(2025, 2, 23)
}

# # # # # # # # # #
# DAG definition  #
# # # # # # # # # #
with DAG(
    dag_id="etl_bcr_generalized_sufosat_extract",
    default_args=dag_args,
    schedule_interval="@monthly",  
    catchup=False,
) as dag:
    
    # # # # # # # # # # # # # # # # # # # #
    # Group : Extract tif and load to S3  #
    # # # # # # # # # # # # # # # # # # # # 
    with TaskGroup("extract_pipeline") as extract_pipeline:
    # Task check if in s3
        file_in_s3 = PythonOperator(
            task_id="file_in_s3",
            python_callable=check_tif_in_s3,
            op_args=[bucket_name, s3_key, s3_hook, api_query_file_name],
            provide_context=True
        )

        # Task check if metadata was updated
        update_task = PythonOperator(
            task_id="is_metadata_update",
            python_callable=data_update,
            op_args=[api_query_file_name, bucket_name, s3_key_metadata, s3_hook],
            provide_context=True,
        )

        # Task extract file from sufosat
        extract_task = PythonOperator(
            task_id="extract_tif_data_and_upload",
            python_callable=extract_tif_data_and_upload,
            op_args=[url, s3_key, bucket_name, s3_hook],
            provide_context=True,
        )

        # Conditionnal task for extraction
        def conditionally_run_extract(**kwargs):
            do_update = kwargs["ti"].xcom_pull(task_ids="extract_pipeline.is_metadata_update", key="do_update")
            in_s3 = kwargs["ti"].xcom_pull(task_ids="extract_pipeline.file_in_s3", key="in_s3")

            if not in_s3:
                result = "extract_pipeline.extract_tif_data_and_upload"
            elif do_update:
                result = "extract_pipeline.extract_tif_data_and_upload"
            else:
                result = "extract_pipeline.skip_task"

            return result

        # Conditionnal task to extract
        condition_task = BranchPythonOperator(
            task_id="conditionally_run_extract",
            python_callable=conditionally_run_extract,
            provide_context=True,
        )
        
        # Skip task
        skip_task = EmptyOperator(
            task_id="skip_task",
            trigger_rule="all_failed"  # Marque comme "échec" si aucune tâche amont ne réussit
        )

        # Update metadata task
        update_metadata = PythonOperator(
            task_id="update_metadata",
            python_callable=update_metadata,
            op_args=[bucket_name, s3_key_metadata, s3_hook],
            provide_context=True,
        )

        # dag schema
        [file_in_s3, update_task] >> condition_task >> [extract_task, skip_task]
        extract_task >> update_metadata 

    # # # # # # # # # # # # # # # # # # # #
    # Group : Vectorize and tranform tif  #
    # # # # # # # # # # # # # # # # # # # # 
    with TaskGroup("transformation_pipeline") as transformation_pipeline:
         # Loading to transform task
        load_from_S3 = PythonOperator(
            task_id="load_from_S3",
            python_callable=load_from_S3,
            op_args=[bucket_name, s3_key, s3_hook, download_path],
            provide_context=True,
            trigger_rule="none_failed_min_one_success" # IMPORTANT  
        )

        regroup_sufosat_days = PythonOperator(
            task_id="regroup_sufosat_days",
            python_callable=filter_raster_by_date,
            op_args=[
                # SORTIR DU HARD CODE ?
                "dags/temp_tif/mosaics_tropisco_warnings_france_date.tif",
                "dags/temp_tif/mosaics_tropisco_warnings_france_date_2024.tif",
                pd.Timestamp(year=2024, month=1, day=1),
                pd.Timestamp(year=2024, month=12, day=31),
            ]
        )

        polygonize_tif = PythonOperator(
            task_id= "polygonize_tif",
            python_callable=polygonize_tif,
        )

        process_geo_data = PythonOperator(
            task_id= "process_geo_data",
            python_callable=process_geo_data,
        )

        upload_geodataframe_to_s3 = PythonOperator(
            task_id= "upload_geodataframe_to_s3",
            python_callable=upload_geodataframe_to_s3,
            op_args=[bucket_name, s3_hook],
            provide_context=True
        )

        # dag schema
        load_from_S3 >> regroup_sufosat_days >> polygonize_tif >> process_geo_data >> upload_geodataframe_to_s3

    # Grouped dag schema
    extract_pipeline >> transformation_pipeline

