import json
import requests
from datetime import datetime


def check_tif_in_s3(bucket_name, s3_key_prefix, s3_hook, **kwargs):
    not_in_s3 = True
    result = s3_hook.list_keys(bucket_name=bucket_name, prefix=s3_key_prefix)

    if result:
        for obj_key in result:
            filename = obj_key.split("/")[-1]
            if filename == "mosaics_tropisco_warnings_france_date.tif":
                not_in_s3 = False
            
    kwargs['ti'].xcom_push(key='not_in_s3', value=not_in_s3)


def data_update(query: str, bucket_name: str, s3_key_metadata: str, s3_hook, **kwargs):
    url = f"https://zenodo.org/api/records/13685177/files/{query}"
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        data = response.json()
    else:
        raise Exception(f"Erreur lors de la requête API : {response.status_code}")

    metadata_object = s3_hook.get_key(bucket_name=bucket_name, key=s3_key_metadata)
    metadata_content = metadata_object.get()['Body'].read().decode('utf-8')
    metadata = json.loads(metadata_content)

    date_format = "%Y-%m-%dT%H:%M:%S"
    base_date = datetime.strptime(metadata["date_source"].split(".")[0], date_format)
    date_extracted = datetime.strptime(data["updated"].split(".")[0], date_format)

    do_update = base_date < date_extracted
    print(f"✅ Inspection de la metadata effectuée, mise à jour requise : {do_update}")

    kwargs['ti'].xcom_push(key='do_update', value=do_update)
    kwargs['ti'].xcom_push(key='metadata', value=data)
    kwargs['ti'].xcom_push(key='mymetadata', value=metadata)


def extract_tif_data_and_upload(url: str, s3_key: str, bucket_name: str, s3_hook, **kwargs):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        s3_hook.load_file_obj(r.raw, s3_key, bucket_name)
    print(f"✅ Fichier uploadé avec succès sur S3: {s3_key}")


def update_metadata(bucket_name, s3_key, s3_hook, incr_version=0.1, **kwargs):
    metadata = kwargs['ti'].xcom_pull(task_ids='data_update', key='metadata')
    my_metadata = kwargs['ti'].xcom_pull(task_ids='data_update', key='mymetadata')

    if not my_metadata or 'version' not in my_metadata:
        version = 1.0  
    else:
        version = my_metadata['version'] + incr_version

    meta_data = {
        "version": version,
        "s3_key": s3_key,
        "bucket_name": bucket_name,
        "data_source_link": metadata['links']['self'],
        "date_source": metadata['updated'],
        "file_name": metadata['key'],
        "date_extract": datetime.now().strftime("%Y-%m-%d"),
        "size": metadata['size'],
        "mimetype": metadata['mimetype'],
        "metadata": {
            "width": metadata['metadata']['width'],
            "height": metadata['metadata']['height']
        }
    }

    meta_data_json = json.dumps(meta_data)
    existing_keys = s3_hook.list_keys(bucket_name=bucket_name, prefix=s3_key)
    if existing_keys:
        s3_hook.delete_objects(bucket_name, keys=[s3_key])
    
    s3_hook.load_string(meta_data_json, key=s3_key, bucket_name=bucket_name, replace=True)

    kwargs['ti'].xcom_push(key='update_meta_data', value=meta_data)


