import yaml
import geopandas as gpd
from utils.logging_etl import etl_logger
from utils.polygonizer import Polygonizer
from utils.prepare_polygon import PreparePolygon


def filter_and_polygonize():
    polygonizer = Polygonizer()
    logger = etl_logger("logs/transform.log")

    with open("config/config.yaml") as stream:
        configs = yaml.safe_load(stream)

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
    prepare_polygon = PreparePolygon()
    logger = etl_logger("logs/transform.log")

    with open("config/config.yaml") as stream:
        configs = yaml.safe_load(stream)

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
        max_days_between_clear_cuts=configs["transform_sufosat"]["max_days_between_clear_cuts"],
    )

    logger.info("Union clear cut clusters...")
    gdf = prepare_polygon.union_clear_cut_clusters(gdf)
