#!/usr/bin/env python3
import yaml
import os
import geopandas as gpd
from utils.logging_etl import etl_logger
from extract import check_tif_in_s3, data_update, extract_tif_data_and_upload, update_metadata
from transform import (
    # Loading and transforming part
    load_from_S3,
    filter_raster_by_date,
    parse_sufosat_date,
    polygonize_tif,
    # Clustering part
    cluster_clear_cuts,
    union_clear_cut_clusters,
    filter_out_clear_cuts_with_complex_shapes,
    # Export
    save_data,
)

# Configurer le logger
logger = etl_logger("logs/main.log")

# Charger la configuration
with open("config/config.yaml") as stream:
    configs = yaml.safe_load(stream)


def verify_file_in_s3():
    logger.info("Vérification du fichier dans S3...")
    return check_tif_in_s3(
        configs["extract_sufosat"]["s3_prefix"], configs["extract_sufosat"]["s3_filename"]
    )


def check_for_updates():
    logger.info("Vérification des mises à jour...")
    return data_update(
        configs["extract_sufosat"]["zendo_filename"], configs["extract_sufosat"]["zendo_id"]
    )


def extract_and_upload_data(update_info):
    if update_info["do_update"]:
        logger.info("Extraction des données depuis Zenodo...")
        extract_tif_data_and_upload(
            configs["extract_sufosat"]["zendo_id"],
            configs["extract_sufosat"]["zendo_filename"],
            configs["extract_sufosat"]["s3_prefix"]
            + configs["extract_sufosat"]["zendo_filename"],
        )

    update_metadata(
        configs["extract_sufosat"]["s3_prefix"],
        configs["extract_sufosat"]["s3_sufosat_metadata"],
        update_info,
    )


def prepare_sufosat_v3(
    s3_prefix: str,
    zendo_filename: str,
    download_path: str,
    start_date: int,
    end_date: int,
    input_tif_filepath: str,
    output_tif_filepath: str,
    raster_path: str,
    vector_path: str,
):
    # Load and transform the sufosat layer to a vector layer
    load_from_S3(s3_prefix, zendo_filename, download_path)
    filter_raster_by_date(input_tif_filepath, output_tif_filepath, start_date, end_date)
    polygonize_tif(raster_path, vector_path)

    # Read the SUFOSAT vectorized data
    gdf: gpd.GeoDataFrame = gpd.read_file(vector_path)

    # Export the polygonized data
    save_data(
        gdf,
        os.path.join(
            configs["transform_sufosat"]["download_path"], "processed_vector_data.geoparquet"
        ),
    )

    # Transform the SUFOSAT date numbers into actual python dates
    gdf["date"] = gdf["DN"].apply(parse_sufosat_date)
    gdf = gdf.drop(columns="DN")

    # Export the data with dates
    save_data(
        gdf,
        os.path.join(
            configs["transform_sufosat"]["download_path"], "clear_cuts_with_date.geoparquet"
        ),
    )

    gdf = cluster_clear_cuts(
        gdf=gdf,
        max_meters_between_clear_cuts=configs["transform_sufosat"][
            "max_meters_between_clear_cuts"
        ],
        max_days_between_clear_cuts=configs["transform_sufosat"]["max_days_between_clear_cuts"],
    )

    save_data(
        gdf,
        os.path.join(
            configs["transform_sufosat"]["download_path"], "clear_cuts_clustered.geoparquet"
        ),
    )

    gdf = union_clear_cut_clusters(gdf)

    save_data(
        gdf,
        os.path.join(
            configs["transform_sufosat"]["download_path"],
            "clear_cuts_cluster_unioned.geoparquet",
        ),
    )

    filter_out_clear_cuts_with_complex_shapes(
        gdf=gdf,
        concave_hull_ratio=configs["transform_sufosat"]["magic_number"],
        concave_hull_score_threshold=configs["transform_sufosat"]["magic_number"],
    )

    save_data(
        gdf,
        os.path.join(
            configs["transform_sufosat"]["download_path"], "clear_cuts_processed.geoparquet"
        ),
    )

    logger.info("✅ Preparation of the sufosat layer completed")


def run_pipeline():
    try:
        logger.info("🚀 Démarrage du pipeline ETL")
        # Step 1: Extract sufosat tiff data
        file_exists = verify_file_in_s3()
        update_info = check_for_updates()
        if update_info["do_update"] or not file_exists:
            extract_and_upload_data(update_info)

        # Step 2: Prepare sufosat layer
        prepare_sufosat_v3(
            s3_prefix=configs["extract_sufosat"]["s3_prefix"],
            zendo_filename=configs["extract_sufosat"]["zendo_filename"],
            download_path=configs["transform_sufosat"]["download_path"],
            start_date=configs["transform_sufosat"]["start_date"],
            end_date=configs["transform_sufosat"]["end_date"],
            input_tif_filepath=configs["transform_sufosat"]["download_path"]
            + configs["extract_sufosat"]["zendo_filename"],
            output_tif_filepath=configs["transform_sufosat"]["download_path"]
            + configs["transform_sufosat"]["filtered_raster"],
            raster_path=configs["transform_sufosat"]["download_path"]
            + configs["transform_sufosat"]["filtered_raster"],
            vector_path=configs["transform_sufosat"]["download_path"]
            + configs["transform_sufosat"]["polygonized_data"],
        )

        logger.info("✅ Pipeline ETL terminé avec succès")
    except Exception as e:
        logger.error(f"❌ Erreur dans le pipeline ETL: {str(e)}")


if __name__ == "__main__":
    # if len(sys.argv) > 1:
    #     task = sys.argv[1]

    #     try:
    #         if task == "verify_file_in_s3":
    #             verify_file_in_s3()
    #         elif task == "check_for_updates":
    #             check_for_updates()
    #         elif task == "extract_and_upload_data":
    #             update_info = check_for_updates()
    #             extract_and_upload_data(update_info)
    #         elif task == "load_data_from_s3":
    #             load_data_from_s3()
    #         elif task == "filter_raster":
    #             filter_raster()
    #         elif task == "polygonize":
    #             polygonize()
    #         elif task == "process_vector_data":
    #             clear_cut = process_vector_data()
    #             save_data(
    #                 clear_cut,
    #                 os.path.join(
    #                     configs["transform_sufosat"]["download_path"],
    #                     "processed_vector_data.geoparquet",
    #                 ),
    #             )
    #         elif task == "spatial_join":
    #             clear_cut_cluster = spatial_join()
    #             save_data(
    #                 clear_cut_cluster,
    #                 os.path.join(
    #                     configs["transform_sufosat"]["download_path"],
    #                     "spatial_joined_data.geoparquet",
    #                 ),
    #             )
    #         elif task == "clean_clusters":
    #             clear_cut_cluster_cleaned = clean_clusters()
    #             save_data(
    #                 clear_cut_cluster_cleaned,
    #                 os.path.join(
    #                     configs["transform_sufosat"]["download_path"],
    #                     "cleaned_clusters.geoparquet",
    #                 ),
    #             )
    #         elif task == "group_cuts":
    #             clear_cut_group = group_cuts()
    #             save_data(
    #                 clear_cut_group,
    #                 os.path.join(
    #                     configs["transform_sufosat"]["download_path"], "grouped_cuts.geoparquet"
    #                 ),
    #             )
    #         elif task == "calculate_areas":
    #             clear_cut_group_areas = calculate_areas()
    #             save_data(
    #                 clear_cut_group_areas,
    #                 os.path.join(
    #                     configs["transform_sufosat"]["download_path"], "cut_areas.geoparquet"
    #                 ),
    #             )
    #         elif task == "calculate_concave_hulls":
    #             clear_cut_group_concave = calculate_concave_hulls()
    #             save_data(
    #                 clear_cut_group_concave,
    #                 os.path.join(
    #                     configs["transform_sufosat"]["download_path"],
    #                     "concave_hulls.geoparquet",
    #                 ),
    #             )
    #         elif task == "export_results":
    #             export_results()
    #         else:
    #             logger.error(f"Tâche non reconnue: {task}")
    #     except Exception as e:
    #         logger.error(f"Erreur lors de l'exécution de la tâche '{task}': {str(e)}")
    # else:
    run_pipeline()
