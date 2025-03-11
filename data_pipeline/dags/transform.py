import io
import os
import shutil
import rasterio
import logging
import numpy as np
import pandas as pd
from tqdm import tqdm
import geopandas as gpd
from disjoin_set import DisjointSet
from osgeo import gdal, ogr, osr


# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Récupération du fichier S3
def load_from_S3(bucket_name, s3_key, s3_hook, download_path):
    if "temp_tif" not in os.listdir():
        os.makedirs("temp_tif", exist_ok=True)
    try:
        s3_hook.download_file(
            bucket_name=bucket_name, 
            key=s3_key, 
            local_path="dags/"+download_path, 
            preserve_file_name=True, 
            use_autogenerated_subdir=False
        )

        logger.info("✅ Fichier téléchargé depuis S3")
    except Exception as e:
        logger.error(f"❌ Erreur lors du téléchargement du fichier depuis S3: {e}")

# Filtrer la data pour le dernier mois
def filter_raster_by_date(
        input_tif_filepath, 
        output_tif_filepath, 
        start_day, 
        end_day, 
        sufosat_start_day=pd.Timestamp(year=2014, month=4, day=3),
        **kwargs
        ):
    
    # Calculate precise day differences
    start_days = (start_day - sufosat_start_day).days
    end_days = (end_day - sufosat_start_day).days
    
    with rasterio.open(input_tif_filepath) as src:
        # Preserve original metadata
        profile = src.profile.copy()
        
        # Consider keeping original data type if possible
        # profile.update(dtype=rasterio.uint16)  # or another appropriate type
        
        with rasterio.open(output_tif_filepath, "w", **profile) as dst:
            # Process in blocks to manage memory
            for _, window in src.block_windows():
                # Read block data
                data = src.read(1, window=window)
                
                # Create a mask preserving granular values within date range
                mask = (data >= start_days) & (data <= end_days)
                filtered_data = np.where(mask, data, 0)
                
                # Write processed block
                dst.write(filtered_data, 1, window=window)
                
    kwargs["ti"].xcom_push(key="regrouped_tif_path", value=output_tif_filepath)
    logger.info("✅ Fichier tif regroupé")

# Vectorisation du raster
def polygonize_tif(**kwargs): 
    raster_path = kwargs["ti"].xcom_pull(task_ids="transformation_pipeline.regroup_sufosat_days", key="regrouped_tif_path")
    vector_path = "dags/temp_shape/"
    filename = "mosaics_tropisco_warnings_france_date_2024.shp"   
    os.makedirs(os.path.dirname(vector_path+filename), exist_ok=True)

    # Ouvrir le raster
    raster_ds = gdal.Open(raster_path)
    if raster_ds is None:
        raise ValueError(f"Échec de l'ouverture du raster : {raster_path}")
    else:
        print("✅ Raster ouvert avec Gdal")

    srs = osr.SpatialReference()
    srs.ImportFromWkt(raster_ds.GetProjectionRef())

    driver = ogr.GetDriverByName("ESRI Shapefile")
    if driver is None:
        raise RuntimeError("Pilote Shapefile non disponible.")
    if os.path.exists(vector_path):
        driver.DeleteDataSource(vector_path)
    vector_ds = driver.CreateDataSource(vector_path)
    if vector_ds is None:
        raise RuntimeError(f"Échec de la création du Shapefile : {vector_path}")
    layer = vector_ds.CreateLayer("polygons", srs=srs, geom_type=ogr.wkbPolygon)
    if layer is None:
        raise RuntimeError("Échec de la création de la couche.")

    field_dn = ogr.FieldDefn("DN", ogr.OFTInteger)
    layer.CreateField(field_dn)

    band = raster_ds.GetRasterBand(1)
    mask_band = band

    # Appliquer la fonction Polygonize avec la bonne configuration
    result = gdal.Polygonize(band, mask_band, layer, 0, ["8CONNECTED=YES"])
    if result != 0:
        raise RuntimeError("Échec de la polygonisation.")

    # Nettoyer et fermer les fichiers
    layer = None
    vector_ds = None
    raster_ds = None

    kwargs["ti"].xcom_push(key="vector_path", value=vector_path)
    
    # Afficher les logs en print 
    logger.info("✅ Fichier shapefile créé")
    logger.info("✅ Couche SRS créée")
    logger.info("✅ Polygonisation du raster réussie")


# Imbrication de fonction
def convert_geometries_to_wkt(sufosat_2024):
    for col in sufosat_2024.columns:
            if col != "geometry" and sufosat_2024[col].dtype.name == "geometry":
                sufosat_2024[col] = sufosat_2024[col].apply(lambda geom: geom.wkt if geom else None)
    logger.info("✅ Conversion des géométries en WKT")

    geojson_str = sufosat_2024.to_json()
    logger.info("✅ Conversion str GEOJSON")
    
    return geojson_str

# Transformation du raster 
def process_geo_data(**kwargs):
    vector_path = kwargs["ti"].xcom_pull(task_ids="transformation_pipeline.polygonize_tif", key="vector_path")
    sufosat_2024: gpd.GeoDataFrame = gpd.read_file(vector_path)
    clear_cut = sufosat_2024

    # Gestion ajout des dates
    clear_cut["date"] = pd.Timestamp(year=2014, month=4, day=3) + pd.to_timedelta(clear_cut["DN"], unit="D")
    clear_cut["date"] = clear_cut["date"].dt.strftime("%Y-%m-%d")
    clear_cut["date"] = pd.to_datetime(clear_cut["date"])
    clear_cut.drop(["DN"], axis=1, inplace=True)
    logger.info(f"✅ Calcul des dates - {clear_cut.date.dtype}")

    # Reprojection et buffer
    clear_cut = clear_cut.to_crs(epsg=2154)
    MAX_METERS_BETWEEN_CLEAR_CUTS = 50
    clear_cut["buffered"] = clear_cut.geometry.buffer(MAX_METERS_BETWEEN_CLEAR_CUTS / 2)
    logger.info(f"✅ Buffer du polygone")

    # Sjoin cluster 
    clear_cut_buffered = clear_cut.set_geometry("buffered").drop(columns="geometry")
    clear_cut_cluster: gpd.GeoDataFrame = clear_cut_buffered.sjoin(clear_cut_buffered, predicate="intersects").drop(
        columns="buffered"
    )
    logger.info(f"✅ Spatial join")

    clear_cut_cluster: gpd.GeoDataFrame = clear_cut_cluster.reset_index().rename(
        columns={"index": "index_left"}
    )
    clear_cut_cluster = clear_cut_cluster[clear_cut_cluster["index_left"] != clear_cut_cluster["index_right"]]
    clear_cut_cluster = clear_cut_cluster[clear_cut_cluster["index_left"] < clear_cut_cluster["index_right"]]
    logger.info(f"✅ Filtre date 2")

    MAX_DAYS_BETWEEN_CLEAR_CUTS = 7 * 4
    clear_cut_cluster = clear_cut_cluster[
        (clear_cut_cluster["date_left"] - clear_cut_cluster["date_right"]).dt.days.abs()
        <= MAX_DAYS_BETWEEN_CLEAR_CUTS
    ]
    logger.info(f"✅ Filtre date 3")

    # Disjoin Set
    clear_cuts_disjoint_set = DisjointSet(clear_cut.index.tolist())
    logger.info(f"✅ Disjoin Set")

    # Then we group the clear cuts that belong together one pair at a time
    for index_left, index_right in clear_cut_cluster[["index_left", "index_right"]].itertuples(
        index=False
    ):
        clear_cuts_disjoint_set.merge(index_left, index_right)
    logger.info(f"✅ Then we group the clear cuts that belong together one pair at a time")

    subsets = clear_cuts_disjoint_set.subsets()
    for i, subset in enumerate(subsets):
        clear_cut.loc[list(subset), "clear_cut_group"] = i
    clear_cut = clear_cut.drop(columns="buffered")
    clear_cut["clear_cut_group"] = clear_cut["clear_cut_group"].astype(int)
    logger.info(f"✅ clear_cut_group 1")


    clear_cut_group = clear_cut.dissolve(by="clear_cut_group", aggfunc={"date": ["min", "max"]}).rename(
        columns={
            ("date", "min"): "date_min",
            ("date", "max"): "date_max",
        }
    )
    clear_cut_group["days_delta"] = (clear_cut_group["date_max"] - clear_cut_group["date_min"]).dt.days
    clear_cut_group["clear_cut_group_size"] = clear_cut.groupby("clear_cut_group").size()
    logger.info(f"✅ clear_cut_group 2")

    clear_cut_group["geometry"] = clear_cut_group["geometry"].buffer(0.0001)
    clear_cut_group["area_ha"] = clear_cut_group.area / 10000
    clear_cut_group = clear_cut_group[clear_cut_group["area_ha"] >= 0.5].copy()
    logger.info(f"✅ clear_cut area")

    clear_cut_group["concave_hull_score"] = clear_cut_group.area / clear_cut_group.concave_hull(0.42).area
    clear_cut_group = clear_cut_group[clear_cut_group["concave_hull_score"] >= 0.42]
    logger.info(f"✅ Filter clear_cuts by concave_hull_score")

    # Finalisation
    # Créer le dossier correct avant d'écrire
    os.makedirs(os.path.dirname("dags/temp_export/clear_cut_processed.geoparquet"), exist_ok=True)
    # Exporter le fichier
    clear_cut_group.to_parquet("dags/temp_export/clear_cut_processed.geoparquet", engine="pyarrow")
    logger.info(f"✅ exported")

    shutil.rmtree("dags/temp_tif")
    shutil.rmtree("dags/temp_shape")

    kwargs["ti"].xcom_push(key="processed_data", value="dags/temp_export/clear_cut_processed.geoparquet")
