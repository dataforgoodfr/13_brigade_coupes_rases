#!/usr/bin/env python3
import yaml
import os
import sys
from extract import *
from transform import *
from utils.disjoin_set import DisjointSet
from utils.logging import etl_logger

# Configurer le logger
logger = etl_logger("logs/main.log")

# Charger la configuration
with open("config/config.yaml") as stream:
    configs = yaml.safe_load(stream)


def run_pipeline():
    try:
        logger.info("🚀 Démarrage du pipeline ETL")
        
        # Étape 1: Vérifier si le fichier existe dans S3
        logger.info("Vérification du fichier dans S3...")
        file_exists = check_tif_in_s3(
            configs["extract_sufosat"]["s3_prefix"], 
            configs["extract_sufosat"]["s3_filename"]
        )
        
        # Étape 2: Vérifier si une mise à jour est nécessaire
        logger.info("Vérification des mises à jour...")
        update_info = data_update(
            configs["extract_sufosat"]["zendo_filename"], 
            configs["extract_sufosat"]["zendo_id"]
        )
        
        # Si mise à jour nécessaire ou fichier absent de S3
        if update_info["do_update"] or not file_exists:
            logger.info("Extraction des données depuis Zenodo...")
            # Étape 3: Extraire les données et télécharger vers S3
            extract_tif_data_and_upload(
                configs["extract_sufosat"]["zendo_id"],
                configs["extract_sufosat"]["zendo_filename"],
                configs["extract_sufosat"]["s3_prefix"] + configs["extract_sufosat"]["zendo_filename"],
            )
            
            # Étape 4: Mettre à jour les métadonnées
            update_metadata(
                configs["extract_sufosat"]["s3_prefix"], 
                configs["extract_sufosat"]["s3_sufosat_metadata"],
                update_info
            )
        
        # Étape 5: Charger les données depuis S3
        logger.info("Chargement des données depuis S3...")
        load_from_S3(
            configs["extract_sufosat"]["s3_prefix"],
            configs["extract_sufosat"]["zendo_filename"],
            configs["transform_sufosat"]["download_path"]
        )
        
        # Étape 6: Filtrer le raster par date
        logger.info("Filtrage du raster par date...")
        filter_raster_by_date(
            input_tif_filepath=configs["transform_sufosat"]["download_path"] + configs["extract_sufosat"]["zendo_filename"],
            output_tif_filepath=configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["filtered_raster"]
        )
        
        # Étape 7: Polygoniser le TIF
        logger.info("Polygonisation du TIF...")
        polygonize_tif(
            configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["filtered_raster"], 
            configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["polygonized_data"], 
        )
        
        # Étape 8: Lire le shapefile
        logger.info("Traitement des données vectorielles...")
        clear_cut = read_shape(
            configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["polygonized_data"]
        )
        
        # Étape 9: Calculer les dates
        clear_cut = compute_date(clear_cut)
        
        # Étape 10: Reprojection et buffer
        clear_cut = reprojection_n_buffer(clear_cut)
        
        # Étape 11: Spatial join
        clear_cut_cluster = sjoin_data(clear_cut)
        
        # Étape 12: Nettoyer les clusters
        clear_cut_cluster = clean_cluster(clear_cut_cluster)
        
        # Étape 13: Grouper les coupes forestières
        clear_cuts_disjoint_set = DisjointSet(clear_cut.index.tolist())
        clear_cut_group = group_clear_cuts(clear_cut_cluster, clear_cuts_disjoint_set, clear_cut)
        
        # Étape 14: Calculer les superficies
        clear_cut_group = clear_cut_area(clear_cut_group)
        
        # Étape 15: Calculer les enveloppes concaves
        clear_cut_group = compute_concave(clear_cut_group)
        
        # Étape 16: Exporter les données
        logger.info("Exportation des données traitées...")
        # Assurez-vous que le répertoire d'export existe
        # os.makedirs(configs["transform_sufosat"]["export_path"], exist_ok=True)
        export_data(
            clear_cut_group, 
            configs["transform_sufosat"]["download_path"],
            configs["transform_sufosat"]["export_filename"]
        )
        
        logger.info("✅ Pipeline ETL terminé avec succès")
        return True
    except Exception as e:
        logger.error(f"❌ Erreur dans le pipeline ETL: {str(e)}")
        return False

run_pipeline()