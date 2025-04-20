# -*- coding: utf-8 -*-
"""
Created on Sun Mar 23 13:19:34 2025

@author: cindy
"""

import os

from dotenv import load_dotenv
from pykeepass import PyKeePass

load_dotenv()

keepass_password = os.getenv("KEEPASS_PASSWORD")

if keepass_password is None:
    raise ValueError("La variable d'environnement KEEPASS_PASSWORD n'est pas définie.")

kp = PyKeePass(
    "../../../keepass/secrets.kdbx", password=keepass_password
)  # Accès à la base KeePass

entry = kp.find_entries(
    title="SCW_ACCESS_KEY", first=True
)  # Récupérer la clé d'accès du bucket S3
access_key = entry.password if entry else None

entry = kp.find_entries(
    title="SCW_SECRET_KEY", first=True
)  # Récupérer la clé secrète du bucket S3
secret_key = entry.password if entry else None

if not access_key or not secret_key:
    raise ValueError("Impossible de récupérer les credentials S3 depuis KeePass.")

print("Access Key et Secret Key récupérés avec succès.")
