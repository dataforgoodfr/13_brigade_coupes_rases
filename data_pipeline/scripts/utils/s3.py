import os
import boto3
from dotenv import load_dotenv

class S3Manager:
    load_dotenv()

    def __init__(self):
        self.s3 = boto3.client(
            service_name="s3",
            region_name=os.getenv("S3_REGION"),
            endpoint_url=os.getenv("S3_ENDPOINT"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
    

    def file_check(self, s3_key_prefix, my_filename):
        try:
            in_s3 = False
            response = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=s3_key_prefix)
            if "Contents" in response:
                for obj in response["Contents"]:
                    filename = obj["Key"].split("/")[-1]
                    if filename == my_filename:
                        in_s3 = True
                        print(f"✅ Fichier trouvé dans S3 : {my_filename}")
                        break
            if not in_s3:
                print(f"ℹ️ Fichier non trouvé dans S3 : {my_filename}")
            return in_s3
        except Exception as e:
            print(f"❌ Erreur lors de la vérification du fichier dans S3: {e}")
            return False


    def load_file_memory(self, s3_key):
        try:
            response = self.s3.get_object(Bucket=self.bucket_name, Key=s3_key)
            metadata_content = response["Body"].read().decode("utf-8")
            print(f"✅ Fichier chargé en mémoire depuis S3 : {s3_key}")
            return metadata_content
        except Exception as e:
            print(f"❌ Erreur lors du chargement du fichier depuis S3: {e}")
            raise


    def download_from_s3(self, s3_key, download_path):
        os.makedirs("temp_tif", exist_ok=True)
        try:
            with open(download_path, 'wb') as f:
                self.s3.download_fileobj(self.bucket_name, s3_key, f)
            print(f'✅ Fichier téléchargé depuis S3 : {download_path}')
        except Exception as e:
            print(f"❌ Erreur lors du téléchargement du fichier depuis S3: {e}")


    def delete_from_s3(self, s3_key):
        try:
            self.s3.delete_object(Bucket=self.bucket_name, Key=s3_key)
            print(f"✅ Fichier supprimé avec succès : {s3_key}")
        except Exception as e:
            print(f"❌ Erreur lors de la suppression du fichier depuis S3: {e}")


    def upload_to_s3(self, file_path, s3_key):
        try:
            with open(file_path, "rb") as f:
                self.s3.upload_fileobj(f, self.bucket_name, s3_key)
            print(f"✅ Fichier uploadé avec succès : {s3_key}")
        except Exception as e:
            print(f"❌ Erreur lors de l'upload du fichier vers S3: {e}")
