import geopandas as gpd
import yaml
from utils.cuts_update import cutsUpdateRules
from utils.df_utils import save_gdf
from utils.logging_etl import etl_logger
from utils.polygonizer import Polygonizer
from utils.prepare_polygon import PreparePolygon
from utils.s3 import S3Manager

# Configs
updater = cutsUpdateRules()
s3_manager = S3Manager()
polygonizer = Polygonizer()
prepare_polygon = PreparePolygon()
updater = cutsUpdateRules()
logger = etl_logger("logs/transform.log")

with open("config/config.yaml") as stream:
    configs = yaml.safe_load(stream)


def filter_and_polygonize():
    logger.info("Filter raster date...")
    polygonizer.filter_raster_by_date(
        input_tif_filepath=configs["transform_sufosat"]["download_path"]
        + configs["extract_sufosat"]["zendo_filename"],
        output_tif_filepath=configs["transform_sufosat"]["download_path"]
        + configs["transform_sufosat"]["filtered_raster"],
        start_date=configs["transform_sufosat"]["start_date"],
        end_date=configs["transform_sufosat"]["end_date"],
    )

    logger.info("Polygonizing raster data...")
    polygonizer.polygonize_tif(
        raster_path=configs["transform_sufosat"]["download_path"]
        + configs["transform_sufosat"]["filtered_raster"],
        vector_path=configs["transform_sufosat"]["download_path"]
        + configs["transform_sufosat"]["polygonized_data"],
    )


def cluster_clear_cuts_by_time_and_space():
    logger.info("Openning the polygonized data...")
    gdf: gpd.GeoDataFrame = gpd.read_file(
        configs["transform_sufosat"]["download_path"]
        + configs["transform_sufosat"]["polygonized_data"]
    )

    logger.info("Transforming the SUFOSAT date numbers into actual python dates...")
    gdf["date"] = gdf["DN"].apply(prepare_polygon.parse_sufosat_date)
    gdf = gdf.drop(columns="DN")

    logger.info("Filtering the polygons by date and space...")
    gdf = prepare_polygon.cluster_clear_cuts(
        gdf=gdf,
        max_meters_between_clear_cuts=configs["transform_sufosat"][
            "max_meters_between_clear_cuts"
        ],
        max_days_between_clear_cuts=configs["transform_sufosat"][
            "max_days_between_clear_cuts"
        ],
    )

    logger.info("Union clear cut clusters...")
    gdf = prepare_polygon.union_clear_cut_clusters(gdf)

    logger.info("Add concave hull score...")
    gdf = prepare_polygon.add_concave_hull_score(
        gdf=gdf, concave_hull_ratio=configs["transform_sufosat"]["magic_number"]
    )

    logger.info("add area ha...")
    gdf = prepare_polygon.add_area_ha(gdf)

    logger.info("Saving GeodataFrame to geoparquet...")
    save_gdf(
        gdf=gdf,
        output_filepath=configs["transform_sufosat"]["download_path"]
        + "clear_cuts_clustered.geoparquet",
    )


def update_clusters():
    logger.info("Load previous data...")
    s3_manager.download_from_s3(
        s3_key="dataeng/bootstrap/sufosat/sufosat_clusters_2018_2024.fgb",
        download_path=configs["transform_sufosat"]["download_path"]
        + "sufosat_clusters_2018_2024.fgb",
    )

    logger.info("Loading the two files...")
    gdf_filtered: gpd.GeoDataFrame = gpd.read_file(
        configs["transform_sufosat"]["download_path"] + "sufosat_clusters_2018_2024.fgb"
    )
    gdf_new: gpd.GeoDataFrame = gpd.read_parquet(
        configs["transform_sufosat"]["download_path"]
        + "clear_cuts_clustered.geoparquet"
    )

    logger.info("Clustering by space and time...")
    clear_cut_pairs = updater.cluster_by_space(
        gdf_filtered=gdf_filtered, gdf_new=gdf_new
    )

    logger.info("Updating clusters...")
    updater.update_clusters(clear_cut_pairs)

    logger.info("Reveal new clusters...")
    updater.find_new_clusters(gdf_new, clear_cut_pairs)
