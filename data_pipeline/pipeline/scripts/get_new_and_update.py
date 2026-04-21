import pandas as pd
import geopandas as gpd
from shapely.ops import unary_union
from pipeline.scripts import DATA_DIR

def split_new_and_updated_clusters(gdf_new, gdf_ref, distance_threshold=50):
    """
    Sépare les nouveaux clusters en deux catégories :
    - Clusters qui matchent avec la référence (updated)
    - Clusters complètement nouveaux (new)
    
    Parameters:
    -----------
    gdf_new : str
        Chemin vers les nouvelles données à classifier
    gdf_ref : str
        Chemin vers les données de référence
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
    
    # Sauvegarde
    gdf_updated.to_file(DATA_DIR / "sufosat" / "clusters_updated.fgb", driver="FlatGeobuf")
    gdf_truly_new.to_file(DATA_DIR / "sufosat" / "clusters_new.fgb", driver="FlatGeobuf")
    
    print(f"\n✅ Fichiers sauvegardés:")
    print(f"   - {DATA_DIR / 'sufosat' / 'clusters_updated.fgb'}")
    print(f"   - {DATA_DIR / 'sufosat' / 'clusters_new.fgb'}")

    return gdf_updated, gdf_truly_new

def update_geometries(distance_threshold=50):
    """
    Met à jour les géométries de référence en les fusionnant avec les clusters updated.
    Utilise les fichiers générés par split_new_and_updated_clusters().
    
    Parameters:
    -----------
    distance_threshold : float
        Distance en mètres pour le matching (défaut: 50m)
    
    Returns:
    --------
    tuple (gdf_ref_updated, gdf_final)
        - gdf_ref_updated : référence avec géométries fusionnées
        - gdf_final : dataset complet (ref_updated + new)
    """
    
    # Chargement des données
    gdf_ref = gpd.read_file(str(DATA_DIR / "sufosat_reference" / "sufosat_clusters_enriched.fgb"))
    gdf_updated = gpd.read_file(str(DATA_DIR / "sufosat" / "clusters_updated.fgb"))
    gdf_new = gpd.read_file(str(DATA_DIR / "sufosat" / "clusters_new.fgb"))
    
    print(f"Chargement:")
    print(f"   - Référence: {len(gdf_ref)} clusters")
    print(f"   - Updated: {len(gdf_updated)} clusters")
    print(f"   - New: {len(gdf_new)} clusters\n")
    
    # Copie pour ne pas modifier l'original
    gdf_ref_updated = gdf_ref.copy()
    
    # Créer un buffer pour le matching
    gdf_ref_buffered = gdf_ref.copy()
    gdf_ref_buffered['geometry'] = gdf_ref_buffered.geometry.buffer(distance_threshold)
    
    # Ajouter un index pour tracker
    gdf_updated_copy = gdf_updated.copy()
    gdf_updated_copy['_new_idx'] = gdf_updated_copy.index
    
    # Spatial join pour trouver les correspondances
    joined = gpd.sjoin(
        gdf_updated_copy,
        gdf_ref_buffered,
        how='left',
        predicate='intersects'
    )
    
    # Grouper par index de référence pour fusionner
    updates = {}
    
    for ref_idx in joined['index_right'].dropna().unique():
        ref_idx = int(ref_idx)
        
        # Trouver tous les nouveaux clusters qui matchent ce cluster de référence
        matching_new = joined[joined['index_right'] == ref_idx]
        matching_new_indices = matching_new['_new_idx'].tolist()
        
        # Récupérer les géométries
        ref_geom = gdf_ref_updated.loc[ref_idx, 'geometry']
        new_geoms = gdf_updated.loc[matching_new_indices, 'geometry'].tolist()
        
        # === FUSION DES GÉOMÉTRIES ===
        all_geoms = [ref_geom] + new_geoms
        merged_geom = unary_union(all_geoms)
        
        # === MISE À JOUR DES DATES ===
        all_dates_min = [gdf_ref_updated.loc[ref_idx, 'date_min']] + \
                        gdf_updated.loc[matching_new_indices, 'date_min'].tolist()
        all_dates_max = [gdf_ref_updated.loc[ref_idx, 'date_max']] + \
                        gdf_updated.loc[matching_new_indices, 'date_max'].tolist()
        
        new_date_min = min(all_dates_min)
        new_date_max = max(all_dates_max)
        
        # === RECALCUL DES ATTRIBUTS ===
        new_days_delta = (new_date_max - new_date_min).days
        
        all_sizes = [gdf_ref_updated.loc[ref_idx, 'clear_cut_group_size']] + \
                    gdf_updated.loc[matching_new_indices, 'clear_cut_group_size'].tolist()
        new_group_size = sum(all_sizes)
        
        new_area_ha = merged_geom.area / 10000  # m² -> ha
        
        all_scores = [gdf_ref_updated.loc[ref_idx, 'concave_hull_score']] + \
                     gdf_updated.loc[matching_new_indices, 'concave_hull_score'].tolist()
        new_concave_hull_score = sum(all_scores) / len(all_scores)
        
        # Stocker les mises à jour
        updates[ref_idx] = {
            'geometry': merged_geom,
            'date_min': new_date_min,
            'date_max': new_date_max,
            'days_delta': new_days_delta,
            'clear_cut_group_size': new_group_size,
            'area_ha': new_area_ha,
            'concave_hull_score': new_concave_hull_score
        }
    
    # Appliquer toutes les mises à jour
    for ref_idx, update_values in updates.items():
        for col, value in update_values.items():
            gdf_ref_updated.loc[ref_idx, col] = value
    
    # Statistiques
    n_updated = len(updates)
    print(f"Mise à jour des géométries:")
    print(f"   - Clusters de référence mis à jour: {n_updated}/{len(gdf_ref)}")
    print(f"   - Clusters de référence inchangés: {len(gdf_ref) - n_updated}")
    
    # Combiner référence updated + nouveaux clusters
    gdf_final = pd.concat([gdf_ref_updated, gdf_new], ignore_index=True)
    
    print(f"\n Dataset final:")
    print(f"   - gdf_ref_updated: {len(gdf_ref_updated)} clusters")
    print(f"   - gdf_final: {len(gdf_final)} clusters (ref_updated + new)")
    
    # Sauvegarde
    gdf_ref_updated.to_file(DATA_DIR / "sufosat_reference" / "sufosat_clusters_enriched_UPDATED.fgb", driver="FlatGeobuf")
    gdf_final.to_file(DATA_DIR / "sufosat" / "clusters_final.fgb", driver="FlatGeobuf")
    
    print(f"\n Fichiers sauvegardés:")
    print(f"   - {DATA_DIR / 'sufosat_reference' / 'sufosat_clusters_enriched_UPDATED.fgb'}")
    print(f"   - {DATA_DIR / 'sufosat' / 'clusters_final.fgb'}")
    
    return gdf_ref_updated, gdf_final
