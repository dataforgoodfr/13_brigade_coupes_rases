"""
Simple functional script to export database to FlatGeobuf file.
"""

from pathlib import Path

import geopandas as gpd
from sqlalchemy import create_engine


def export_database(database_url: str, output_file: str) -> None:
    engine = connect_db(database_url)
    gdf = extract_data(engine)
    gdf = convert_arrays_to_strings(gdf)
    gdf = reorder_columns(gdf)
    save_to_file(gdf, Path(output_file))
    print_summary(gdf)


def connect_db(database_url: str):
    """Create database connection."""
    print("📡 Connecting to database...")
    engine = create_engine(database_url, plugins=["geoalchemy2"])
    print("✅ Connected!")
    return engine


def get_export_query() -> str:
    """Return the SQL query to extract all data."""
    return """
        WITH 
        natura2000_aggregated AS (
            SELECT 
                ccez.clear_cut_id,
                ARRAY_AGG(ez.code ORDER BY ez.code) as natura2000_codes
            FROM clear_cut_ecological_zoning ccez
            JOIN ecological_zonings ez ON ccez.ecological_zoning_id = ez.id
            GROUP BY ccez.clear_cut_id
        ),
        city_info AS (
            SELECT 
                ccr.id as report_id,
                c.zip_code as city_insee_code
            FROM clear_cuts_reports ccr
            LEFT JOIN cities c ON ccr.city_id = c.id
        ),
        group_sizes AS (
            SELECT 
                report_id,
                COUNT(*) as clear_cut_group_size
            FROM clear_cuts
            GROUP BY report_id
        )
        SELECT 
            cc.id as clear_cut_group,
            cc.observation_start_date as date_min,
            cc.observation_end_date as date_max,
            EXTRACT(DAY FROM (cc.observation_end_date - cc.observation_start_date)) as days_delta,
            COALESCE(gs.clear_cut_group_size, 1) as clear_cut_group_size,
            NULL::float as concave_hull_score,
            cc.area_hectare as area_ha,
            ARRAY[ci.city_insee_code] as cities,
            cc.ecological_zoning_area_hectare as natura2000_area_ha,
            COALESCE(n2k.natura2000_codes, ARRAY[]::text[]) as natura2000_codes,
            cc.bdf_deciduous_area_hectare as bdf_deciduous_area_ha,
            cc.bdf_mixed_area_hectare as bdf_mixed_area_ha,
            cc.bdf_poplar_area_hectare as bdf_poplar_area_ha,
            cc.bdf_resinous_area_hectare as bdf_resinous_area_ha,
            ccr.slope_area_hectare as slope_area_ha,
            cc.boundary as geometry
        FROM clear_cuts cc
        LEFT JOIN clear_cuts_reports ccr ON cc.report_id = ccr.id
        LEFT JOIN natura2000_aggregated n2k ON cc.id = n2k.clear_cut_id
        LEFT JOIN city_info ci ON ccr.id = ci.report_id
        LEFT JOIN group_sizes gs ON cc.report_id = gs.report_id
        ORDER BY cc.id
    """


def extract_data(engine) -> gpd.GeoDataFrame:
    """Extract data from database as GeoDataFrame."""
    print("📥 Extracting data from database...")
    query = get_export_query()

    # Read from database
    gdf = gpd.read_postgis(query, con=engine, geom_col="geometry", crs="EPSG:4326")

    # FORCE conversion to ensure it's really a GeoDataFrame
    print(f"   Initial type: {type(gdf)}")
    if "geometry" in gdf.columns:
        gdf = gpd.GeoDataFrame(gdf, geometry="geometry", crs="EPSG:4326")

    print(f"✅ Extracted {len(gdf)} records")
    print(f"   Final type: {type(gdf)}")
    print(f"   CRS: {gdf.crs}")

    print(gdf.head())
    return gdf


def convert_arrays_to_strings(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Convert array columns to strings for FlatGeobuf compatibility."""
    print("🔄 Converting arrays to strings...")

    if "natura2000_codes" in gdf.columns:
        gdf["natura2000_codes"] = gdf["natura2000_codes"].apply(
            lambda x: str(list(x)) if x is not None and len(x) > 0 else None
        )

    if "cities" in gdf.columns:
        gdf["cities"] = gdf["cities"].apply(
            lambda x: str(list(x)) if x is not None and len(x) > 0 else None
        )

    return gdf


def reorder_columns(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Reorder columns to match original format."""
    column_order = [
        "clear_cut_group",
        "date_min",
        "date_max",
        "days_delta",
        "clear_cut_group_size",
        "concave_hull_score",
        "area_ha",
        "cities",
        "natura2000_area_ha",
        "natura2000_codes",
        "bdf_deciduous_area_ha",
        "bdf_mixed_area_ha",
        "bdf_poplar_area_ha",
        "bdf_resinous_area_ha",
        "slope_area_ha",
        "geometry",
    ]

    # Keep only columns that exist (geometry handled by geopandas)
    existing_cols = [col for col in column_order if col in gdf.columns]
    print("AVANT EXPORT")
    print(gdf.head())
    return gdf[existing_cols]


def save_to_file(gdf: gpd.GeoDataFrame, output_path: Path) -> None:
    """Save GeoDataFrame to FlatGeobuf file."""
    print(f"💾 Saving to {output_path}...")

    # Sécurisation de la pipeline
    gdf = gpd.GeoDataFrame(gdf)

    # Create output directory if needed
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Save to FlatGeobuf
    gdf.to_file(output_path, driver="FlatGeobuf")

    print(f"✅ Saved {len(gdf)}")


def print_summary(gdf: gpd.GeoDataFrame) -> None:
    """Print summary statistics."""
    print("\n" + "=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    print(f"Total records:     {len(gdf)}")
    print(f"Total area (ha):   {gdf['area_ha'].sum():.2f}")
    print(f"Date range:        {gdf['date_min'].min()} to {gdf['date_max'].max()}")
    print(f"With Natura 2000:  {gdf['natura2000_codes'].notna().sum()}")
    print(f"CRS:               {gdf.crs}")
    print("=" * 50)
