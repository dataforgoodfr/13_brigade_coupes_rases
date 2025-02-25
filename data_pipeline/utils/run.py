import importlib
import logging
import os
import json
import dotenv

# Importer et charger les variables d'environnement depuis config.py
from config.config import load_env_variables

load_env_variables()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Define the expected environment variables and their corresponding JSON keys
env_vars = {
    "BUCKET_NAME": "bucket_name",
    "API_QUERY": "api_query",
    "S3_KEY": "s3_key",
    "S3_KEY_METADATA": "s3_key_metadata",
    "DOWNLOAD_PATH": "download_path",
    "URL": "url"
}

# Read values from environment variables
config = {json_key: os.getenv(env_var, "") for env_var, json_key in env_vars.items()}

# Write to JSON file
with open("config.json", "w") as f:
    json.dump(config, f, indent=4)

print("Configuration saved to config.json")
