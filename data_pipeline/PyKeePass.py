# -*- coding: utf-8 -*-
"""
Created on Tue Feb 25 19:24:49 2025

@author: cindy
"""

import os
from pykeepass import PyKeePass
from dotenv import load_dotenv

load_dotenv()

keepass_password = os.getenv("KEEPASS_PASSWORD")

if keepass_password is None:
    raise ValueError("La variable d'environnement KEEPASS_PASSWORD n'est pas définie.")

kp = PyKeePass('data_pipeline/secrets.kdbx', password=keepass_password) #Accès à la base KeePass

entry = kp.find_entries(title='SCW_ACCESS_KEY', first=True) # Récupérer la clé d'accès du bucket S3
access_key = entry.password if entry else None 

entry = kp.find_entries(title='SCW_SECRET_KEY', first=True) # Récupérer la clé secrète du bucket S3
secret_key = entry.password if entry else None

if not access_key or not secret_key:
    raise ValueError("Impossible de récupérer les credentials S3 depuis KeePass.")

print("Access Key et Secret Key récupérés avec succès.")