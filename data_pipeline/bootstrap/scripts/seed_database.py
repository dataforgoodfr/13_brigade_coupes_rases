"""
Database seeding script that populates the following tables:

- `ecological_zonings`: Protected natural areas (Natura 2000 sites)
- `clear_cuts_reports`: Detected forest clear-cut reports pending validation
- `clear_cuts`: clear-cuts groups detected by SUFOSAT
- `clear_cut_ecological_zoning`: Many-to-many relationship between clear-cuts and ecological zones
"""

import argparse
import ast
import logging
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
from sqlalchemy import create_engine, text

from bootstrap.scripts.utils import display_df, load_gdf


class DatabaseSeeder:
    """
    Handles the seeding of forest clear-cuts data into the database
    """

    TABLES = [
        "ecological_zonings",
        "clear_cuts_reports",
        "clear_cuts",
        "clear_cut_ecological_zoning",
    ]

    def __init__(self, database_url: str):
        """
        Initialize the database seeder.

        Parameters
        ----------
        database_url : str
            SQLAlchemy connection string
        """
        logging.info("Initializing DatabaseSeeder")
        self.engine = create_engine(database_url, plugins=["geoalchemy2"])
        # Test connection
        with self.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logging.info("Database connection successful")

        # Using EPSG:4326 for compatibility with the backend
        # TODO: Consider using EPSG:2154 (Lambert93) for more accurate representations in France
        self.crs = "EPSG:4326"
        logging.info(f"Using CRS: {self.crs}")

    def display_table_sample(self, table: str) -> None:
        logging.info(f"Fetching data sample from the `{table}` table")
        df = pd.read_sql(f"SELECT * FROM {table} LIMIT 10", con=self.engine)
        display_df(df)

    def insert_records_in_database(
        self, df: pd.DataFrame | gpd.GeoDataFrame, table: str
    ) -> None:
        logging.info(f"Inserting {len(df)} `{table}` records into database")
        display_df(df)
        if isinstance(df, gpd.GeoDataFrame):
            df.to_postgis(
                table, con=self.engine, if_exists="append", index=False, chunksize=10000
            )
        elif isinstance(df, pd.DataFrame):
            df.to_sql(table, con=self.engine, if_exists="append", index=False)
        logging.info(f"`{table}` records inserted successfully")
        self.display_table_sample(table)

    def update_serial(self, table: str) -> None:
        # Update the sequence for the SERIAL column so that it doesn't generate IDs that already exists
        logging.info(f"Updating ID sequence for `{table}`")
        with self.engine.connect() as conn:
            # Update
            conn.execute(
                text(f"SELECT setval('{table}_id_seq', (SELECT MAX(id) FROM {table}))")
            )

            # After update
            current_val = conn.execute(
                text(f"SELECT currval('{table}_id_seq')")
            ).scalar()
            logging.info(f"{table}_id_seq value set to: {current_val}")

    def wipe_database(self) -> None:
        logging.warning("Danger zone - Starting database wipe operation")

        logging.info(f"Tables to be wiped: {', '.join(self.TABLES)}")

        # Check row counts in each table
        with self.engine.connect() as conn:
            for table_name in self.TABLES:
                row_count = conn.execute(
                    text(f"SELECT COUNT(*) FROM {table_name}")
                ).one()[0]
                logging.info(f"Before wipe: {table_name} contains {row_count} rows")

            # Ask for user confirmation
            confirmation = input(
                f"\n⚠️  You are about to delete ALL DATA from the {', '.join(self.TABLES)} tables ⚠️\nType 'YES' to confirm: "
            )
            if confirmation != "YES":
                print()
                sys.exit(0)

            # Wipe
            logging.info("Executing database wipe...")
            truncate_stmt = (
                f"TRUNCATE TABLE {', '.join(self.TABLES)} RESTART IDENTITY CASCADE"
            )
            conn.execute(text(truncate_stmt))
            conn.commit()
            logging.info("Tables truncated successfully")

            # Check row counts in each table after wipe
            for table_name in self.TABLES:
                row_count = conn.execute(
                    text(f"SELECT COUNT(*) FROM {table_name}")
                ).one()[0]
                logging.info(f"After wipe: {table_name} contains {row_count} rows")

        logging.info("Database wipe completed")

    def seed_ecological_zonings(self, natura2000_concat_filepath: Path) -> None:
        logging.info("Starting to seed ecological_zonings table")

        logging.info("Load the Natura 2000 codes")
        natura2000_concat = load_gdf(natura2000_concat_filepath).drop(
            columns="geometry"
        )

        logging.info("Transform the Natura 2000 geodataframe into the database schema")
        natura2000_concat = natura2000_concat.rename(columns={"type": "sub_type"})
        natura2000_concat["type"] = "Natura 2000"

        # INSERT
        self.insert_records_in_database(natura2000_concat, "ecological_zonings")

        logging.info("ecological_zonings table seeded successfully")

    def add_city_id_to_sufosat(self, sufosat: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        # Retrieve the generated `id` for the `cities` table
        logging.info("Fetching city IDs from database")
        city_ids = pd.read_sql(
            "SELECT id AS city_id, zip_code AS city_insee_code FROM cities",
            con=self.engine,
        )
        display_df(city_ids)

        # TODO: In the dataeng data model, we have several cities that can intersect with a clear-cut
        # However, in the backend model we have just one. For now, we arbitrarily take the first one in the list
        logging.info(
            "Extracting first city INSEE code from each clear-cut since the backend doesn't support multiple cities yet"
        )
        sufosat["city_insee_code"] = sufosat["cities"].apply(ast.literal_eval).str[0]

        # Add the city_id column to our sufosat clear-cuts
        length_before_merge = len(sufosat)
        logging.info(
            f"Merging with city data ({length_before_merge} records before merge)"
        )
        sufosat = sufosat.merge(city_ids, on="city_insee_code", how="left")

        # Handle data discrepancies
        missing_city_ids = sufosat["city_id"].isna().sum()
        if missing_city_ids:
            logging.warning(f"Found {missing_city_ids} records with missing city_id")

        # TODO: There is a discrepency between the cities codes used in the dataeng pipeline and in the backend
        # For example, some in the backend table, some zip_code are associated with multiple city names, e.g.,

        #   id	    zip_code    name	        department_id
        # 0	13884	34246	    Entre-Vignes	1
        # 1	13885	34246	    Saint-Christol	1

        # There is also the "01001" insee_code that is missing from the backend table

        # For now, to mitigate this,
        # we'll drop records with missing city_id and
        # we'll drop records that have different city_id for the same insee_code
        # Therefore we have to select a city_id randomly because the join causes duplicated records otherwise
        sufosat = sufosat.dropna(subset="city_id").drop_duplicates("clear_cut_group")
        if len(sufosat) != length_before_merge:
            logging.warning(f"After cleaning: {len(sufosat)} records remain")

        # Make sure we don't remove too much records
        assert (
            sufosat["city_id"].isna().sum() == 0
            and len(sufosat) >= length_before_merge - 100
        ), "Too many records were removed during city_id matching"

        display_df(sufosat)

        return sufosat

    def seed_clear_cuts_reports(
        self, enriched_clear_cuts_filepath: Path, sample: int | None = None
    ) -> gpd.GeoDataFrame:
        logging.info("Starting to seed clear_cuts_reports table")

        # Load our Sufosat enriched dataframe
        sufosat = load_gdf(enriched_clear_cuts_filepath)
        if sample:
            logging.info(f"Using a sample of {sample} records")
            sufosat = sufosat.sample(n=sample, random_state=42)
        else:
            logging.info("Using all available records")

        sufosat = self.add_city_id_to_sufosat(sufosat)

        # Add metadata fields
        # TODO: We also need the created_at, updated_at, and status fields, maybe these could be auto-generated by the database?
        logging.info("Adding metadata fields (created_at, updated_at, status)")
        sufosat["created_at"] = pd.Timestamp.utcnow()
        sufosat["updated_at"] = pd.Timestamp.utcnow()
        sufosat["status"] = "to_validate"

        # Format our Sufosat dataframe for the clear_cuts_reports table
        logging.info("Preparing data for clear_cuts_reports table")
        clear_cuts_reports = sufosat.rename(
            columns={"clear_cut_group": "id", "slope_area_ha": "slope_area_hectare"}
        )[
            [
                "id",
                "slope_area_hectare",
                "city_id",
                "created_at",
                "updated_at",
                "status",
            ]
        ]

        # INSERT
        self.insert_records_in_database(clear_cuts_reports, "clear_cuts_reports")

        # Update SERIAL
        self.update_serial("clear_cuts_reports")

        logging.info("clear_cuts_reports table seeded successfully")

        return sufosat

    def fix_bdforet_data_quality_issues(
        self, sufosat: gpd.GeoDataFrame
    ) -> gpd.GeoDataFrame:
        # TODO: There is an issue with the BDFORET joins
        # Some clear-cuts overlap with several BDFORET polygons of the same or different wood types
        # This can lead to a BDFORET coverage > 100%, which doesn't make sense.
        # See `analytics/notebooks/stats_bdforet.ipynb` for details.
        # For now, as a quick workaround, we simply normalize the areas to avoid a coverage > 100%
        # Eventually, this should be handled in:
        # - `data_pipeline/bootstrap/scripts/preprocess_bdforet.py` (for deduplicating polygons of the same wood type)
        # - `data_pipeline/bootstrap/scripts/enrich_sufosat_clusters.py` (for handling overlaps between different wood types)

        # Calculate the total BDFORET area for each clear-cut by summing all forest type area columns
        bdf_area_ha = (
            sufosat["bdf_deciduous_area_ha"].fillna(0)
            + sufosat["bdf_mixed_area_ha"].fillna(0)
            + sufosat["bdf_poplar_area_ha"].fillna(0)
            + sufosat["bdf_resinous_area_ha"].fillna(0)
        )

        # Compute BDFORET coverage as the ratio of total BDFORET area to the actual feature area
        bdf_coverage = bdf_area_ha / sufosat["area_ha"]

        # Identify rows where the BDFORET coverage is greater than 100%
        needs_to_be_normalized = bdf_coverage > 1

        # Normalize each BDFORET area column proportionally so that total coverage does not exceed 100%
        for bdf_col in [
            "bdf_deciduous_area_ha",
            "bdf_mixed_area_ha",
            "bdf_poplar_area_ha",
            "bdf_resinous_area_ha",
        ]:
            sufosat.loc[needs_to_be_normalized, bdf_col] = (
                sufosat.loc[needs_to_be_normalized, bdf_col]
                / bdf_coverage.loc[needs_to_be_normalized]
            )

        return sufosat

    def seed_clear_cuts(self, sufosat: gpd.GeoDataFrame) -> None:
        logging.info("Starting to seed clear_cuts table")

        # Fix the BDF areas
        sufosat = self.fix_bdforet_data_quality_issues(sufosat)

        # Transform CRS
        logging.info(f"Transforming CRS from {sufosat.crs} to EPSG:{self.crs}")
        sufosat = sufosat.to_crs(self.crs)

        # Create representative point for location
        logging.info("Calculating representative points for location field")
        sufosat["location"] = sufosat.representative_point()

        # Set report_id
        logging.info("Setting report_id equal to clear_cut_group for initial seed")
        # Since this is the first seed of the database, the clear_cuts_reports.id is equal to clear_cuts.id
        sufosat["report_id"] = sufosat["clear_cut_group"]

        # Transform Sufosat into the `clear_cuts` table format
        logging.info("Preparing data for clear_cuts table")
        clear_cuts = sufosat.rename(
            columns={
                "clear_cut_group": "id",
                "area_ha": "area_hectare",
                "geometry": "boundary",
                "date_min": "observation_start_date",
                "date_max": "observation_end_date",
                "natura2000_area_ha": "ecological_zoning_area_hectare",
                "bdf_deciduous_area_ha": "bdf_deciduous_area_hectare",
                "bdf_mixed_area_ha": "bdf_mixed_area_hectare",
                "bdf_poplar_area_ha": "bdf_poplar_area_hectare",
                "bdf_resinous_area_ha": "bdf_resinous_area_hectare",
                # TODO: Add the "concave_hull_score" field?
            }
        ).set_geometry("boundary")

        clear_cuts = clear_cuts[
            [
                "id",
                "report_id",
                "location",
                "boundary",
                "observation_start_date",
                "observation_end_date",
                "area_hectare",
                "ecological_zoning_area_hectare",
                "bdf_deciduous_area_hectare",
                "bdf_mixed_area_hectare",
                "bdf_poplar_area_hectare",
                "bdf_resinous_area_hectare",
                "created_at",
                "updated_at",
            ]
        ]

        # INSERT
        self.insert_records_in_database(clear_cuts, "clear_cuts")

        # Update SERIAL
        self.update_serial("clear_cuts")

        logging.info("clear_cuts table seeded successfully")

    def seed_clear_cut_ecological_zoning(self, sufosat: gpd.GeoDataFrame) -> None:
        logging.info("Starting to seed clear_cut_ecological_zoning table")

        # Retrieve the generated `ecological_zoning_id`
        logging.info("Fetching ecological_zoning IDs from database")
        ecological_zonings_ids = pd.read_sql(
            "SELECT code AS natura2000_code, id AS ecological_zoning_id FROM ecological_zonings",
            con=self.engine,
        )
        display_df(ecological_zonings_ids)

        logging.info("Preparing ecological zoning relationships data")
        clear_cut_ecological_zoning = (
            sufosat.rename(columns={"clear_cut_group": "clear_cut_id"})
            .set_index("clear_cut_id")["natura2000_codes"]
            .dropna()
            .apply(
                ast.literal_eval
            )  # List of strings don't seem to be supported by FlatGeoBuf
            .explode()  # Explode the list of zones into individual rows
            .rename("natura2000_code")
        ).reset_index()

        logging.info(
            f"Created {len(clear_cut_ecological_zoning)} ecological zoning relationships"
        )
        display_df(clear_cut_ecological_zoning)

        # Join the "natura2000_code" from Sufosat with the "ecological_zoning_id" from the database
        logging.info("Joining with ecological_zoning_id")
        clear_cut_ecological_zoning = clear_cut_ecological_zoning.merge(
            ecological_zonings_ids, on="natura2000_code"
        ).drop(columns="natura2000_code")

        logging.info(
            f"After join: {len(clear_cut_ecological_zoning)} relationships remaining"
        )
        display_df(clear_cut_ecological_zoning)

        # INSERT
        self.insert_records_in_database(
            clear_cut_ecological_zoning, "clear_cut_ecological_zoning"
        )

        logging.info("clear_cut_ecological_zoning table seeded successfully")

    def seed_database(
        self,
        natura2000_concat_filepath: Path,
        enriched_clear_cuts_filepath: Path,
        sample: int | None = None,
    ) -> None:
        self.wipe_database()
        self.seed_ecological_zonings(natura2000_concat_filepath)
        sufosat = self.seed_clear_cuts_reports(enriched_clear_cuts_filepath, sample)
        self.seed_clear_cuts(sufosat)
        self.seed_clear_cut_ecological_zoning(sufosat)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed database with clear cuts data")
    parser.add_argument("--database-url", type=str, required=True)
    parser.add_argument("--natura2000-concat-filepath", type=str, required=True)
    parser.add_argument("--enriched-clear-cuts-filepath", type=str, required=True)
    parser.add_argument(
        "--sample",
        type=int,
        default=None,
        help="Number of clear-cuts samples to use (default: use all data)",
    )
    args = parser.parse_args()
    logging.info("=== Starting database seeding process ===")
    DatabaseSeeder(args.database_url).seed_database(
        Path(args.natura2000_concat_filepath),
        Path(args.enriched_clear_cuts_filepath),
        args.sample,
    )
    logging.info("=== Database seeding completed successfully ===")
