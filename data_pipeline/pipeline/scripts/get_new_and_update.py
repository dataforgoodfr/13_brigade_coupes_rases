import pandas as pd
import geopandas as gpd
from pipeline.scripts import DATA_DIR

def split_new_and_updated_clusters(gdf_new, gdf_ref, distance_threshold=50):
    """
    Sépare les nouveaux clusters en deux catégories :
    - Clusters qui matchent avec la référence (updated)
    - Clusters complètement nouveaux (new)
    
    Parameters:
    -----------
    gdf_new : STR
        Les STR données à classifier
    gdf_ref : STR
        Les données de référence
    distance_threshold : float
        Distance en mètres pour considérer deux clusters comme identiques (défaut: 50m)
    
    Returns:
    --------
    tuple (gdf_updated, gdf_new)
        - gdf_updated : GeoDataFrame des clusters qui matchent avec la référence
        - gdf_new : GeoDataFrame des clusters complètement nouveaux
    """

    # Ouverture
    gdf_new = gpd.read_file(gdf_new)
    gdf_ref = gpd.read_file(gdf_ref)
    
    # Vérifier que les deux GeoDataFrames ont le même CRS
    if gdf_new.crs != gdf_ref.crs:
        print(f"Attention: CRS différents. Reprojection de gdf_new vers {gdf_ref.crs}")
        gdf_new = gdf_new.to_crs(gdf_ref.crs)
    
    # S'assurer qu'on travaille en mètres (projection métrique)
    if not gdf_new.crs.is_projected:
        print("Attention: CRS géographique détecté. Reprojection en mètres recommandée.")
    
    # Créer un buffer de 50m autour des géométries de référence
    gdf_ref_buffered = gdf_ref.copy()
    gdf_ref_buffered['geometry'] = gdf_ref_buffered.geometry.buffer(distance_threshold)
    
    # Ajouter un index unique pour tracker les correspondances
    gdf_new = gdf_new.copy()
    gdf_new['_temp_idx'] = range(len(gdf_new))
    
    # Spatial join pour trouver les intersections
    # left join pour garder tous les nouveaux clusters
    joined = gpd.sjoin(
        gdf_new, 
        gdf_ref_buffered, 
        how='left', 
        predicate='intersects'
    )
    
    # Identifier les clusters qui ont matché (ont un index_right non-null)
    matched_indices = joined[joined['index_right'].notna()]['_temp_idx'].unique()
    
    # Séparer en deux datasets
    gdf_updated = gdf_new[gdf_new['_temp_idx'].isin(matched_indices)].copy()
    gdf_truly_new = gdf_new[~gdf_new['_temp_idx'].isin(matched_indices)].copy()
    
    # Nettoyer la colonne temporaire
    gdf_updated = gdf_updated.drop(columns=['_temp_idx'])
    gdf_truly_new = gdf_truly_new.drop(columns=['_temp_idx'])
    
    # Statistiques
    print(f"Résultats du matching:")
    print(f" - Total nouvelles données: {len(gdf_new)}")
    print(f" - Clusters matchés (updated): {len(gdf_updated)} ({len(gdf_updated)/len(gdf_new)*100:.1f}%)")
    print(f" - Clusters nouveaux: {len(gdf_truly_new)} ({len(gdf_truly_new)/len(gdf_new)*100:.1f}%)")
    
    gdf_updated.to_file(DATA_DIR / "sufosat" / "clusters_updated.fgb", driver="FlatGeobuf")
    gdf_new.to_file(DATA_DIR / "sufosat" / "clusters_new.fgb", driver="FlatGeobuf")

    return gdf_updated, gdf_truly_new

def upadte_geometries():
    gdf_new = gpd.read_file(str(DATA_DIR / "sufosat_reference" / "filtered_clusters_enriched.fgb"))
    gdf_ref = gpd.read_file(str(DATA_DIR / "sufosat" / "sufosat_clusters.fgb"))

    print("new", gdf_new.columns)
    print("ref", gdf_ref.columns)
    
    