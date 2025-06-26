import ee
import os
import pandas as pd
import geopandas as gpd
import json
from shapely.geometry import mapping

ee.Initialize(project='ringed-tempo-379310') # nom du projet sur GCP


def build_indexvegetation_from_GEE(date, polygon, coupe_rase_id):

    start_date = '2018-01-01'
    end_date = date
    scale = 10  # mètres

    zone = ee.Geometry(mapping(polygon))

    # DICTIONNAIRE DES INDICES PROVENANT DE FORDEAD
    dict_vi = {
        "CRSWIR": {'formula': 'B11/(B8A+((B12-B8A)/(2185.7-864))*(1610.4-864))', 'dieback_change_direction': '+'},
        "NDVI": {'formula': '(B8-B4)/(B8+B4)', 'dieback_change_direction': '-'},
        "BSI":  {'formula': '(B4 + B2 - B3)/(B4 + B2 + B3)', 'dieback_change_direction': '-'},
        "NDWI": {'formula': '(B8A-B11)/(B8A+B11)', 'dieback_change_direction': '-'},
        "NBR":  {'formula': '(B8-B12)/(B8+B12)', 'dieback_change_direction': '-'},
        "NDMI": {'formula': '(B8-B11)/(B8+B11)', 'dieback_change_direction': '-'}
    }

    # MASQUES
    def mask_s2_clouds(image):
        scl = image.select('SCL')
        # mask = scl.eq(4)
        mask = scl.eq(4).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10)).And(scl.neq(11))
        return image.updateMask(mask)

    def custom_mask(image):
        b2 = image.select('B2')
        b3 = image.select('B3')
        b4 = image.select('B4')
        condition = b2.gt(600).Or(b3.eq(0)).Or(b4.eq(0))
        return image.updateMask(condition.Not())

    # AJOUT DES INDICES
    def add_indices(image):
        return (
            image.addBands(image.expression(dict_vi["CRSWIR"]["formula"],
                {'B11': image.select('B11'), 'B8A': image.select('B8A'), 'B12': image.select('B12')}).rename('CRSWIR'))
                  .addBands(image.expression(dict_vi["NDVI"]["formula"],
                {'B8': image.select('B8'), 'B4': image.select('B4')}).rename('NDVI'))
                  .addBands(image.expression(dict_vi["BSI"]["formula"],
                {'B4': image.select('B4'), 'B2': image.select('B2'), 'B3': image.select('B3')}).rename('BSI'))
                  .addBands(image.expression(dict_vi["NDWI"]["formula"],
                {'B8A': image.select('B8A'), 'B11': image.select('B11')}).rename('NDWI'))
                  .addBands(image.expression(dict_vi["NBR"]["formula"],
                {'B8': image.select('B8'), 'B12': image.select('B12')}).rename('NBR'))
                  .addBands(image.expression(dict_vi["NDMI"]["formula"],
                {'B8': image.select('B8'), 'B11': image.select('B11')}).rename('NDMI'))
        )

    # CHARGEMENT DE LA COLLECTION DE BASE
    raw_collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(zone)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
        .map(mask_s2_clouds)
        .map(custom_mask)
        .select(['B2', 'B3', 'B4', 'B8', 'B8A', 'B11', 'B12'])
    )

    working_collection = raw_collection.map(lambda img: add_indices(img).set('system:time_start', img.date().millis()))

    # EXTRACTION MOYENNE SPATIALE
    def extract_means(image):
        date = ee.Date(image.get('system:time_start')).format("YYYY-MM-dd")
        stats = image.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=zone,
            scale=scale
        )
        return ee.Feature(None, stats.set('date', date))

    features = working_collection.map(extract_means).getInfo()

    # MISE EN FORME DES RESULTATS
    index_series = {k: [] for k in dict_vi.keys()}
    dates = []

    for f in features['features']:
        props = f['properties']
        if all(k in props and props[k] is not None for k in dict_vi.keys()):
            for k in dict_vi.keys():
                index_series[k].append(props[k])
            dates.append(props['date'])

    result = {k: json.dumps(index_series[k]) for k in dict_vi.keys()}
    result["dates"] = json.dumps(dates)
    result["coupe_rase_id"] = coupe_rase_id

    return result


if __name__ == "__main__":
    '''
    Récupération des moyennes d'indices de vegetation sur différentes coupes rases
    '''
    OUTPUT_PATH = "../data/vegetationData/indices_vegetation_1000_coupes_rases.csv"

    # Chargement du fichier coupe rase téléchargé au préalable sur aws s3
    gdf = gpd.read_file("../data/sufosat_clusters_enriched.fgb")
    # On récupére des coupes rases récentes pour une période temporelle historique plus grande
    gdf = gdf[gdf["date_min"] > "2024-01-01"]
    gdf_sample = gdf.sample(n=1000, random_state=42).to_crs("EPSG:4326")
    gdf_sample.reset_index(drop=True, inplace=True)

    # Créer l'en-tête si le fichier n'existe pas
    if not os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "w") as f:
            f.write("CRSWIR,NDVI,BSI,NDWI,NBR,NDMI,dates,coupe_rase_id\n")
        print("🆕 Nouveau fichier créé")

    # Charger les identifiants déjà traités
    existing_ids = set()
    df_existing = pd.read_csv(OUTPUT_PATH)
    existing_ids = set(df_existing["coupe_rase_id"].values)
    print(f"🔁 Reprise en ignorant {len(existing_ids)} polygones déjà traités")

    # Traitement
    for i, row in gdf_sample.iterrows():
        idx = row["clear_cut_group"]
        end_date = row["date_min"]
        if idx in existing_ids:
            continue

        try:
            print(f"▶ Traitement de l'index {i}")
            stats = build_indexvegetation_from_GEE(end_date, row.geometry, idx)
            df_row = pd.DataFrame([stats])
            df_row.to_csv(OUTPUT_PATH, mode='a', header=False, index=False)
        except Exception as e:
            print(f"❌ Erreur à l'index {i} : {e}")
            break

    print("✅ Script terminé (ou interrompu)")