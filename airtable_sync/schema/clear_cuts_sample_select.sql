-- Example read for Airtable / CSV export from replica (geometry as GeoJSON text).
-- Table name in PostgreSQL is clear_cuts (plural).
SELECT
    id,
    area_hectare,
    ST_AsGeoJSON(location)::text   AS location_geojson,
    ST_AsGeoJSON(boundary)::text   AS boundary_geojson,
    created_at::text              AS created_at,
    updated_at::text              AS updated_at,
    observation_start_date::text  AS observation_start_date,
    observation_end_date::text    AS observation_end_date,
    bdf_resinous_area_hectare,
    bdf_deciduous_area_hectare,
    bdf_mixed_area_hectare,
    bdf_poplar_area_hectare,
    ecological_zoning_area_hectare,
    report_id
FROM clear_cuts
ORDER BY id;
