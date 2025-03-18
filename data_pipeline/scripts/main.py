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

def verify_file_in_s3():
    logger.info("Vérification du fichier dans S3...")
    return check_tif_in_s3(
        configs["extract_sufosat"]["s3_prefix"], 
        configs["extract_sufosat"]["s3_filename"]
    )

def check_for_updates():
    logger.info("Vérification des mises à jour...")
    return data_update(
        configs["extract_sufosat"]["zendo_filename"], 
        configs["extract_sufosat"]["zendo_id"]
    )

def extract_and_upload_data(update_info):
    if update_info["do_update"]:
        logger.info("Extraction des données depuis Zenodo...")
        extract_tif_data_and_upload(
            configs["extract_sufosat"]["zendo_id"],
            configs["extract_sufosat"]["zendo_filename"],
            configs["extract_sufosat"]["s3_prefix"] + configs["extract_sufosat"]["zendo_filename"],
        )
        
    update_metadata(
        configs["extract_sufosat"]["s3_prefix"], 
        configs["extract_sufosat"]["s3_sufosat_metadata"],
        update_info
    )

def load_data_from_s3():
    logger.info("Chargement des données depuis S3...")
    load_from_S3(
        configs["extract_sufosat"]["s3_prefix"],
        configs["extract_sufosat"]["zendo_filename"],
        configs["transform_sufosat"]["download_path"]
    )

def filter_raster():
    logger.info("Filtrage du raster par date...")
    filter_raster_by_date(
        input_tif_filepath=configs["transform_sufosat"]["download_path"] + configs["extract_sufosat"]["zendo_filename"],
        output_tif_filepath=configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["filtered_raster"]
    )

def polygonize():
    logger.info("Polygonisation du TIF...")
    polygonize_tif(
        configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["filtered_raster"], 
        configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["polygonized_data"], 
    )

def process_vector_data():
    logger.info("Traitement des données vectorielles...")
    clear_cut = read_shape(
        configs["transform_sufosat"]["download_path"] + configs["transform_sufosat"]["polygonized_data"]
    )
    clear_cut = compute_date(clear_cut)
    clear_cut = reprojection_n_buffer(clear_cut)
    return clear_cut

def load_processed_vector_data():
    logger.info("Chargement des données vectorielles traitées...")
    filepath = os.path.join(configs["transform_sufosat"]["download_path"], "processed_vector_data.geoparquet")
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'process_vector_data' d'abord.")
    clear_cut = read_geoparquet(filepath)
    return clear_cut

def spatial_join(clear_cut=None):
    logger.info("Spatial join...")
    if clear_cut is None:
        clear_cut = load_processed_vector_data()
    return sjoin_data(clear_cut)

def clean_clusters(clear_cut_cluster=None, save_filepath=None):
    logger.info("Nettoyer les clusters...")
    if clear_cut_cluster is None:
        filepath = os.path.join(configs["transform_sufosat"]["download_path"], "spatial_joined_data.geoparquet")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'spatial_join' d'abord.")
        clear_cut_cluster = read_parquet(filepath)
    cleaned_clusters = clean_cluster(clear_cut_cluster)
    if save_filepath:
        save_data(cleaned_clusters, save_filepath)
    return cleaned_clusters

def group_cuts(clear_cut_cluster=None, clear_cut=None):
    logger.info("Grouper les coupes forestières...")
    if clear_cut_cluster is None or clear_cut is None:
        filepath = os.path.join(configs["transform_sufosat"]["download_path"], "cleaned_clusters.geoparquet")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'clean_clusters' d'abord.")
        clear_cut_cluster = read_parquet(filepath)
        
        filepath = os.path.join(configs["transform_sufosat"]["download_path"], "processed_vector_data.geoparquet")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'process_vector_data' d'abord.")
        clear_cut = read_geoparquet(filepath)
    
    clear_cuts_disjoint_set = DisjointSet(clear_cut.index.tolist())
    return group_clear_cuts(clear_cut_cluster, clear_cuts_disjoint_set, clear_cut)

def calculate_areas(clear_cut_group=None):
    logger.info("Calculer les superficies...")
    if clear_cut_group is None:
        filepath = os.path.join(configs["transform_sufosat"]["download_path"], "grouped_cuts.geoparquet")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'group_cuts' d'abord.")
        clear_cut_group = read_geoparquet(filepath)
    return clear_cut_area(clear_cut_group)

def calculate_concave_hulls(clear_cut_group=None):
    logger.info("Calculer les enveloppes concaves...")
    if clear_cut_group is None:
        filepath = os.path.join(configs["transform_sufosat"]["download_path"], "cut_areas.geoparquet")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'calculate_areas' d'abord.")
        clear_cut_group = read_geoparquet(filepath)
        clear_cut_group = clear_cut_group.to_crs(epsg=2154)
    return compute_concave(clear_cut_group)

def export_results(clear_cut_group=None):
    logger.info("Exportation des données traitées...")
    if clear_cut_group is None:
        filepath = os.path.join(configs["transform_sufosat"]["download_path"], "concave_hulls.geoparquet")
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Le fichier {filepath} n'existe pas. Veuillez exécuter 'calculate_concave_hulls' d'abord.")
        clear_cut_group = read_geoparquet(filepath)
    
    export_data(
        clear_cut_group, 
        configs["transform_sufosat"]["download_path"],
        configs["transform_sufosat"]["export_filename"]
    )

def save_data(data, filepath):
    logger.info(f"Enregistrement des données dans {filepath}...")
    data.to_parquet(filepath)

def run_pipeline():
    try:
        logger.info("🚀 Démarrage du pipeline ETL")
        
        file_exists = verify_file_in_s3()
        update_info = check_for_updates()

        if update_info["do_update"] or not file_exists:
            extract_and_upload_data(update_info)
            
        load_data_from_s3()
        filter_raster()
        polygonize()
        clear_cut = process_vector_data()
        save_data(clear_cut, os.path.join(configs["transform_sufosat"]["download_path"], "processed_vector_data.geoparquet"))
        
        clear_cut_cluster = spatial_join(clear_cut)
        save_data(clear_cut_cluster, os.path.join(configs["transform_sufosat"]["download_path"], "spatial_joined_data.geoparquet"))
        
        clear_cut_cluster_cleaned = clean_clusters(clear_cut_cluster)
        save_data(clear_cut_cluster_cleaned, os.path.join(configs["transform_sufosat"]["download_path"], "cleaned_clusters.geoparquet"))
        
        clear_cut_group = group_cuts(clear_cut_cluster_cleaned, clear_cut)
        save_data(clear_cut_group, os.path.join(configs["transform_sufosat"]["download_path"], "grouped_cuts.geoparquet"))
        
        clear_cut_group_areas = calculate_areas(clear_cut_group)
        save_data(clear_cut_group_areas, os.path.join(configs["transform_sufosat"]["download_path"], "cut_areas.geoparquet"))
        
        clear_cut_group_concave = calculate_concave_hulls(clear_cut_group_areas)
        save_data(clear_cut_group_concave, os.path.join(configs["transform_sufosat"]["download_path"], "concave_hulls.geoparquet"))
        
        export_results(clear_cut_group_concave)

        logger.info("✅ Pipeline ETL terminé avec succès")
    except Exception as e:
        logger.error(f"❌ Erreur dans le pipeline ETL: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task = sys.argv[1]
        
        try:
            if task == "verify_file_in_s3":
                verify_file_in_s3()
            elif task == "check_for_updates":
                check_for_updates()
            elif task == "extract_and_upload_data":
                update_info = check_for_updates()
                extract_and_upload_data(update_info)
            elif task == "load_data_from_s3":
                load_data_from_s3()
            elif task == "filter_raster":
                filter_raster()
            elif task == "polygonize":
                polygonize()
            elif task == "process_vector_data":
                clear_cut = process_vector_data()
                save_data(clear_cut, os.path.join(configs["transform_sufosat"]["download_path"], "processed_vector_data.geoparquet"))
            elif task == "spatial_join":
                clear_cut_cluster = spatial_join()
                save_data(clear_cut_cluster, os.path.join(configs["transform_sufosat"]["download_path"], "spatial_joined_data.geoparquet"))
            elif task == "clean_clusters":
                clear_cut_cluster_cleaned = clean_clusters()
                save_data(clear_cut_cluster_cleaned, os.path.join(configs["transform_sufosat"]["download_path"], "cleaned_clusters.geoparquet"))
            elif task == "group_cuts":
                clear_cut_group = group_cuts()
                save_data(clear_cut_group, os.path.join(configs["transform_sufosat"]["download_path"], "grouped_cuts.geoparquet"))
            elif task == "calculate_areas":
                clear_cut_group_areas = calculate_areas()
                save_data(clear_cut_group_areas, os.path.join(configs["transform_sufosat"]["download_path"], "cut_areas.geoparquet"))
            elif task == "calculate_concave_hulls":
                clear_cut_group_concave = calculate_concave_hulls()
                save_data(clear_cut_group_concave, os.path.join(configs["transform_sufosat"]["download_path"], "concave_hulls.geoparquet"))
            elif task == "export_results":
                export_results()
            else:
                logger.error(f"Tâche non reconnue: {task}")
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de la tâche '{task}': {str(e)}")
    else:
        run_pipeline()