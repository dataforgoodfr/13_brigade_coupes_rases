import os
import boto3
import geopandas as gpd
from io import StringIO
from dotenv import load_dotenv

class S3Manager:
    def __init__(self, region="eu-west-3"):
        load_dotenv(f".env")
        self.s3 = boto3.client(
            service_name="s3",
            region_name="fr-par",
            endpoint_url=f"https://s3.fr-par.scw.cloud",
            aws_access_key_id=os.getenv("SCW_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("SCW_SECRET_KEY")
        )
    
    def list_bucket_contents(self, bucket_name):
        try:
            result = self.s3.list_objects_v2(Bucket=bucket_name)
            if "Contents" in result:
                print("Voici les objets présents dans le bucket :")
                for obj in result["Contents"]:
                    print(f"- {obj['Key']}")
            else:
                print("Le bucket est vide ou inaccessible.")
        except Exception as e:
            print(f"❌ Erreur lors de la lecture du bucket : {e}")

    def load_geojson_from_s3(self, bucket_name, s3_key):
        try:
            response = self.s3.get_object(Bucket=bucket_name, Key=s3_key)
            geojson_data = response['Body'].read().decode('utf-8')

            gdf = gpd.read_file(StringIO(geojson_data))

            print("✅ Fichier chargé et converti en GeoDataFrame avec succès")
            return gdf
        except Exception as e:
            print(f"❌ Erreur lors du chargement ou de la conversion du fichier GeoJSON: {e}")
            return None
    
    def download_from_s3(self, bucket_name, s3_key, download_path):
        os.makedirs("temp_tif", exist_ok=True)
        try:
            with open(download_path, 'wb') as f:
                self.s3.download_fileobj(bucket_name, s3_key, f)
            print(f'✅ Fichier téléchargé depuis S3 : {download_path}')
        except Exception as e:
            print(f"❌ Erreur lors du téléchargement du fichier depuis S3: {e}")

