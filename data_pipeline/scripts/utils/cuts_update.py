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
        gdf_filtered = gdf_filtered.to_crs(self.data_crs)
        gdf_new = gdf_new.to_crs(self.data_crs)

        max_date = gdf_new["date_min"].min() - pd.Timedelta(days=lookback_days)
        gdf_filtered = gdf_filtered[gdf_filtered["date_max"] > max_date]

        clear_cut_pairs = (
            gdf_filtered.sjoin(
                gdf_new, how="left", predicate="dwithin", distance=max_distance
            )
            .reset_index()
            .rename(columns={"index": "index_left"})
        )

        return clear_cut_pairs

    def update_clusters(self, clear_cut_pairs):
        updated_data = clear_cut_pairs[~clear_cut_pairs["index_right"].isna()].copy()
        updated_data.loc[:, "date_max"] = updated_data.groupby("index_left")[
            "date_max_right"
        ].transform("max")
        updated_data.loc[:, "status"] = "updated"

        return updated_data

    def find_new_clusters(self, gdf_new, clear_cut_pairs):
        matched_indices = clear_cut_pairs["index_right"].dropna().unique()

        non_matched_new = gdf_new.iloc[~gdf_new.index.isin(matched_indices)].copy()

        matched_unique_count = clear_cut_pairs["index_right"].dropna().nunique()
        self.logger.info(
            f"Number of unique elements in gdf_new matched: {matched_unique_count}"
        )

        expected_non_matched = len(gdf_new) - matched_unique_count
        self.logger.info(
            f"Expected number of unmatched elements: {expected_non_matched}"
        )

        actual_non_matched = len(non_matched_new)
        self.logger.info(f"Actual number of unmatched elements: {actual_non_matched}")

        # Add a "new" flag for these rows
        if not non_matched_new.empty:
            non_matched_new.loc[:, "status"] = "new"

        return non_matched_new
