import geopandas as gpd
import pandas as pd
from utils.logging_etl import etl_logger
from utils.s3 import S3Manager


class cutsUpdateRules:
    def __init__(self):
        self.s3_manager = S3Manager()
        self.logger = etl_logger("logs/transform.log")
        self.data_crs = "EPSG:2154"

    def cluster_by_space(
        self, gdf_filtered, gdf_new, lookback_days=365, max_distance=100
    ):
        """
        Identify spatial relationships between existing and new polygons

        Args:
            gdf_filtered: GeoDataFrame with existing polygons
            gdf_new: GeoDataFrame with new polygons
            lookback_days: Number of days to look back for matching
            max_distance: Maximum distance for spatial join in meters

        Returns:
            GeoDataFrame with spatial relationships identified
        """
        gdf_filtered = gdf_filtered.to_crs(self.data_crs)
        gdf_new = gdf_new.to_crs(self.data_crs)

        # Filter existing polygons by date
        max_date = gdf_new["date_min"].min() - pd.Timedelta(days=lookback_days)
        gdf_filtered = gdf_filtered[gdf_filtered["date_max"] > max_date]

        # Perform spatial join to find relationships
        clear_cut_pairs = (
            gdf_new.sjoin(
                gdf_filtered, how="left", predicate="dwithin", distance=max_distance
            )
            .reset_index()
            .rename(columns={"index": "index_left"})
        )

        # Assign status based on matching
        clear_cut_pairs["status"] = clear_cut_pairs["index_right"].apply(
            lambda x: "grow" if not pd.isna(x) else "new"
        )

        self.logger.info(
            f"Found {len(clear_cut_pairs[clear_cut_pairs['status'] == 'grow'])} 'grow' polygons and {len(clear_cut_pairs[clear_cut_pairs['status'] == 'new'])} 'new' polygons"
        )

        return clear_cut_pairs

    def update_clusters(self, gdf_filtered, gdf_new, clear_cut_pairs):
        """
        Update existing clusters with growth polygons

        Args:
            gdf_filtered: GeoDataFrame with existing polygons
            gdf_new: GeoDataFrame with new polygons
            clear_cut_pairs: Result from cluster_by_space method

        Returns:
            GeoDataFrame with updated cluster geometries
        """
        # Extract grow polygons
        grow_polygons = clear_cut_pairs[clear_cut_pairs["status"] == "grow"]

        if grow_polygons.empty:
            self.logger.info("No clusters to update")
            return pd.DataFrame()

        # Create dataframe for modified polygons
        modified_polygons = gdf_filtered.loc[
            grow_polygons["index_right"].unique()
        ].copy()
        modified_polygons["status"] = "grow"

        # Update geometries for grow polygons
        update_count = 0
        for _idx, row in grow_polygons.iterrows():
            original_idx = row["index_right"]
            growth_idx = row["index_left"]

            try:
                if isinstance(original_idx, pd.Series):
                    original_idx = original_idx.iloc[0]

                if isinstance(growth_idx, pd.Series):
                    growth_idx = growth_idx.iloc[0]

                # Union of geometries
                original_geom = modified_polygons.loc[original_idx, "geometry"]
                growth_geom = gdf_new.loc[growth_idx, "geometry"]

                # Handle both single geometries and Series
                if isinstance(original_geom, pd.Series):
                    original_geom = original_geom.iloc[0]

                if isinstance(growth_geom, pd.Series):
                    growth_geom = growth_geom.iloc[0]

                # Update geometry
                modified_polygons.loc[original_idx, "geometry"] = original_geom.union(
                    growth_geom
                )

                # Update date_max if the new polygon has a more recent date
                orig_date_max = modified_polygons.loc[original_idx, "date_max"]
                new_date_max = gdf_new.loc[growth_idx, "date_max"]

                # Handle both single values and Series
                if isinstance(orig_date_max, pd.Series):
                    orig_date_max = orig_date_max.iloc[0]

                if isinstance(new_date_max, pd.Series):
                    new_date_max = new_date_max.iloc[0]

                if new_date_max > orig_date_max:
                    modified_polygons.loc[original_idx, "date_max"] = new_date_max

                # 1 - Recalculate days_delta
                orig_date_min = modified_polygons.loc[original_idx, "date_min"]
                if isinstance(orig_date_min, pd.Series):
                    orig_date_min = orig_date_min.iloc[0]

                # Now use the updated date_max
                updated_date_max = modified_polygons.loc[original_idx, "date_max"]
                if isinstance(updated_date_max, pd.Series):
                    updated_date_max = updated_date_max.iloc[0]

                # Calculate days_delta
                days_delta = (updated_date_max - orig_date_min).days
                modified_polygons.loc[original_idx, "days_delta"] = days_delta

                # 2 - Recalculate clear_cut_group_size
                orig_size = modified_polygons.loc[original_idx, "clear_cut_group_size"]
                new_size = gdf_new.loc[growth_idx, "clear_cut_group_size"]

                if isinstance(orig_size, pd.Series):
                    orig_size = orig_size.iloc[0]
                if isinstance(new_size, pd.Series):
                    new_size = new_size.iloc[0]

                # Handle potential string values
                if isinstance(orig_size, str):
                    orig_size = float(orig_size)
                if isinstance(new_size, str):
                    new_size = float(new_size)

                modified_polygons.loc[original_idx, "clear_cut_group_size"] = (
                    orig_size + new_size
                )

                # 3 - Recalculate area_ha
                new_geom = modified_polygons.loc[original_idx, "geometry"]
                area_ha = new_geom.area / 10000
                modified_polygons.loc[original_idx, "area_ha"] = area_ha

                # 4 - Recalculate concave_hull_score
                try:
                    geom = (
                        new_geom.iloc[0]
                        if isinstance(new_geom, pd.Series)
                        else new_geom
                    )

                    hull = (
                        gpd.GeoSeries([geom], crs=self.data_crs)
                        .concave_hull(0.42)
                        .iloc[0]
                    )

                    if hull.area > 0:
                        score = geom.area / hull.area
                        score = min(score, 1.0)
                    else:
                        score = 0

                    modified_polygons.loc[original_idx, "concave_hull_score"] = score

                except Exception as e:
                    self.logger.warning(
                        f"Error calculating concave hull for cluster {original_idx}: {e}"
                    )

                update_count += 1
            except Exception as e:
                self.logger.error(
                    f"Error updating cluster {original_idx} with growth {growth_idx}: {str(e)}"
                )

        self.logger.info(f"Successfully updated {update_count} clusters")
        return modified_polygons

    def find_new_clusters(self, gdf_filtered, gdf_new, clear_cut_pairs):
        """
        Identify and process new clusters

        Args:
            gdf_filtered: GeoDataFrame with existing polygons
            gdf_new: GeoDataFrame with new polygons
            clear_cut_pairs: Result from cluster_by_space method

        Returns:
            GeoDataFrame with new clusters
        """
        # Extract new polygons
        new_polygons = clear_cut_pairs[clear_cut_pairs["status"] == "new"]

        if new_polygons.empty:
            self.logger.info("No new clusters found")
            return pd.DataFrame()

        # Prepare new polygons to add
        new_polygons_to_add = gdf_new.loc[new_polygons["index_left"]].copy()
        new_polygons_to_add["status"] = "new"

        # Find the maximum index of existing polygons for incremental indexing
        # Ensure clear_cut_group is numeric
        if not gdf_filtered.empty:
            if isinstance(gdf_filtered.clear_cut_group.iloc[0], str):
                gdf_filtered["clear_cut_group"] = gdf_filtered[
                    "clear_cut_group"
                ].astype(int)

            max_idx = gdf_filtered.clear_cut_group.max()
        else:
            max_idx = -1

        # Ensure max_idx is an integer
        max_idx = int(max_idx) if not pd.isna(max_idx) else -1

        # Reindex new polygons with indices that follow those of gdf_filtered
        new_indices = range(max_idx + 1, max_idx + 1 + len(new_polygons_to_add))
        new_polygons_to_add["clear_cut_group"] = new_indices

        self.logger.info(
            f"Processed {len(new_polygons_to_add)} new clusters with index range {max_idx + 1} to {max_idx + len(new_polygons_to_add)}"
        )
        return new_polygons_to_add

    def combine_results(self, modified_clusters, new_clusters):
        """
        Combine modified and new clusters into a single GeoDataFrame

        Args:
            modified_clusters: GeoDataFrame with updated existing clusters
            new_clusters: GeoDataFrame with new clusters

        Returns:
            Combined GeoDataFrame with all updates
        """
        if modified_clusters.empty and new_clusters.empty:
            self.logger.info("No updates to combine")
            return pd.DataFrame()

        elif modified_clusters.empty:
            self.logger.info(f"Only new clusters present: {len(new_clusters)} entries")
            return new_clusters

        elif new_clusters.empty:
            self.logger.info(
                f"Only modified clusters present: {len(modified_clusters)} entries"
            )
            return modified_clusters

        # Ensure both dataframes have the same CRS before combining
        if modified_clusters.crs and new_clusters.crs:
            if modified_clusters.crs != new_clusters.crs:
                self.logger.info(
                    f"Converting CRS from {new_clusters.crs} to {modified_clusters.crs}"
                )
                new_clusters = new_clusters.to_crs(modified_clusters.crs)
        elif modified_clusters.crs:
            self.logger.info(f"Setting CRS of new clusters to {modified_clusters.crs}")
            new_clusters.set_crs(modified_clusters.crs, inplace=True)
        elif new_clusters.crs:
            self.logger.info(f"Setting CRS of modified clusters to {new_clusters.crs}")
            modified_clusters.set_crs(new_clusters.crs, inplace=True)
        else:
            self.logger.info(f"Setting CRS of both datasets to {self.data_crs}")
            modified_clusters.set_crs(self.data_crs, inplace=True)
            new_clusters.set_crs(self.data_crs, inplace=True)

        # Combine modified and new clusters
        combined_results = pd.concat([modified_clusters, new_clusters])
        self.logger.info(
            f"Combined {len(modified_clusters)} modified and {len(new_clusters)} new clusters"
        )

        return combined_results
