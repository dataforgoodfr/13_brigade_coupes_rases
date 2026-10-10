"""
Chargement incrémental du résultat de la pipeline dans la base du backend.

- Chaque nouveau cluster devient un signalement « to_validate » avec une coupe.
- Les coupes de la base rapprochées d'une nouvelle détection reçoivent le
  contour fusionné, les dates et la surface ; une coupe corrigée à la main
  (``is_manually_edited`` sans ``allow_pipeline_override``) n'est pas touchée.
- Rien n'est supprimé, et ni le statut, ni le bénévole, ni les formulaires
  d'un signalement ne changent.
- Tout passe dans une seule transaction ; le backend recalcule ensuite les
  totaux et les règles des signalements (``POST /sync-reports``).

Relancer le chargement sur les mêmes fichiers n'ajoute rien : un cluster dont
le contour recoupe déjà une coupe en base est ignoré.
"""

import argparse
import ast
import logging
import math
import os
from dataclasses import dataclass
from pathlib import Path

import geopandas as gpd
import pandas as pd
import requests
from sqlalchemy import Connection, Engine, text

from pipeline.scripts import DATA_DIR
from pipeline.scripts.database import create_db_engine

DB_CRS = "EPSG:4326"
NEW_CLUSTERS_PATH = DATA_DIR / "sufosat" / "clusters_new.fgb"
UPDATED_CLUSTERS_PATH = DATA_DIR / "sufosat" / "clusters_reference_updated.fgb"
BDF_COLUMNS = (
    "bdf_resinous_area_ha",
    "bdf_deciduous_area_ha",
    "bdf_mixed_area_ha",
    "bdf_poplar_area_ha",
)
SYNC_TIMEOUT_SECONDS = 300
# Des pixels qui ne se touchent que par un coin donnent des anneaux qui se
# recoupent : PostGIS les répare, et seules les parties polygonales restent.
VALID_BOUNDARY = (
    "ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_GeomFromText(:boundary, 4326)), 3))"
)


@dataclass
class LoadSummary:
    inserted: int = 0
    already_loaded: int = 0
    without_city: int = 0
    updated: int = 0
    locked: int = 0

    def __str__(self) -> str:
        return (
            f"{self.inserted} coupes ajoutées, {self.already_loaded} déjà en base, "
            f"{self.without_city} sans commune connue, {self.updated} mises à jour, "
            f"{self.locked} verrouillées (corrigées à la main)"
        )


def parse_list(value: object) -> list[str]:
    """FlatGeobuf garde les listes sous forme de ``str()`` : les relire."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return []
    if isinstance(value, list | tuple):
        return [str(item) for item in value]
    try:
        parsed = ast.literal_eval(str(value))
    except ValueError, SyntaxError:
        return [str(value)]
    if isinstance(parsed, list | tuple):
        return [str(item) for item in parsed]
    return [str(parsed)]


def optional_float(value: object) -> float | None:
    if value is None:
        return None
    number = float(value)  # type: ignore[arg-type]
    return None if math.isnan(number) else number


def capped_areas(row: pd.Series) -> dict[str, float | None]:
    """Surfaces BD Forêt et Natura 2000 ramenées sous la surface de la coupe.

    Les intersections sont calculées morceau par morceau et peuvent dépasser
    la surface du cluster de quelques mètres carrés ; la base le refuse.
    """
    area = float(row["area_ha"])
    bdf = {column: optional_float(row.get(column)) for column in BDF_COLUMNS}
    bdf_total = sum(value for value in bdf.values() if value is not None)
    if bdf_total > area > 0:
        ratio = area / bdf_total
        bdf = {
            column: None if value is None else value * ratio
            for column, value in bdf.items()
        }
    natura2000 = optional_float(row.get("natura2000_area_ha"))
    if natura2000 is not None:
        natura2000 = min(natura2000, area)
    return {**bdf, "natura2000_area_ha": natura2000}


def to_db_crs(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    gdf = gdf.to_crs(DB_CRS)
    gdf["location_wkt"] = gdf.geometry.make_valid().representative_point().to_wkt()
    gdf["boundary_wkt"] = gdf.geometry.to_wkt()
    for column in ("date_min", "date_max"):
        gdf[column] = pd.to_datetime(gdf[column])
    return gdf


def read_clusters(path: Path) -> gpd.GeoDataFrame:
    if not path.exists():
        return gpd.GeoDataFrame(geometry=[], crs=DB_CRS)
    return gpd.read_file(path)


def already_loaded(conn: Connection, boundary_wkt: str) -> bool:
    return bool(
        conn.execute(
            text(
                "SELECT EXISTS (SELECT 1 FROM clear_cuts "
                f"WHERE ST_Intersects(boundary, {VALID_BOUNDARY}))"
            ),
            {"boundary": boundary_wkt},
        ).scalar_one()
    )


def insert_new_clusters(
    conn: Connection, gdf: gpd.GeoDataFrame, summary: LoadSummary
) -> list[int]:
    """Crée un signalement et sa coupe par nouveau cluster ; renvoie les
    identifiants des signalements créés."""
    if gdf.empty:
        return []
    cities: dict[str, int] = {
        code: city_id
        for code, city_id in conn.execute(text("SELECT zip_code, id FROM cities"))
    }
    zonings: dict[str, int] = {
        code: zoning_id
        for code, zoning_id in conn.execute(
            text("SELECT code, id FROM ecological_zonings")
        )
    }

    report_ids = []
    for _, row in to_db_crs(gdf).iterrows():
        if already_loaded(conn, row["boundary_wkt"]):
            summary.already_loaded += 1
            continue
        city_id = next(
            (cities[code] for code in parse_list(row.get("cities")) if code in cities),
            None,
        )
        if city_id is None:
            logging.warning(
                "Cluster sans commune connue, ignoré : %s", row.get("cities")
            )
            summary.without_city += 1
            continue

        report_id = conn.execute(
            text(
                """
                INSERT INTO clear_cuts_reports
                    (slope_area_hectare, city_id, status, created_at, updated_at)
                VALUES (:slope, :city_id, 'to_validate', NOW(), NOW())
                RETURNING id
                """
            ),
            {"slope": optional_float(row.get("slope_area_ha")), "city_id": city_id},
        ).scalar_one()
        areas = capped_areas(row)
        clear_cut_id = conn.execute(
            text(
                f"""
                INSERT INTO clear_cuts (
                    report_id, location, boundary,
                    observation_start_date, observation_end_date, area_hectare,
                    ecological_zoning_area_hectare,
                    bdf_resinous_area_hectare, bdf_deciduous_area_hectare,
                    bdf_mixed_area_hectare, bdf_poplar_area_hectare,
                    created_at, updated_at
                ) VALUES (
                    :report_id,
                    ST_GeomFromText(:location, 4326),
                    {VALID_BOUNDARY},
                    :date_min, :date_max, :area,
                    :natura2000_area_ha,
                    :bdf_resinous_area_ha, :bdf_deciduous_area_ha,
                    :bdf_mixed_area_ha, :bdf_poplar_area_ha,
                    NOW(), NOW()
                )
                RETURNING id
                """
            ),
            {
                "report_id": report_id,
                "location": row["location_wkt"],
                "boundary": row["boundary_wkt"],
                "date_min": row["date_min"].to_pydatetime(),
                "date_max": row["date_max"].to_pydatetime(),
                "area": float(row["area_ha"]),
                **areas,
            },
        ).scalar_one()
        for code in dict.fromkeys(parse_list(row.get("natura2000_codes"))):
            if code in zonings:
                conn.execute(
                    text(
                        "INSERT INTO clear_cut_ecological_zoning "
                        "(clear_cut_id, ecological_zoning_id) VALUES (:clear_cut, :zoning)"
                    ),
                    {"clear_cut": clear_cut_id, "zoning": zonings[code]},
                )
        report_ids.append(report_id)
        summary.inserted += 1
    return report_ids


def update_reference_clusters(
    conn: Connection, gdf: gpd.GeoDataFrame, summary: LoadSummary
) -> None:
    """Contour fusionné, dates et surface des coupes rapprochées, sauf celles
    corrigées à la main. La surface ne descend jamais sous celles de la BD
    Forêt et de Natura 2000 déjà enregistrées."""
    if gdf.empty:
        return
    for _, row in to_db_crs(gdf).iterrows():
        result = conn.execute(
            text(
                f"""
                UPDATE clear_cuts SET
                    boundary = {VALID_BOUNDARY},
                    location = ST_GeomFromText(:location, 4326),
                    observation_start_date = :date_min,
                    observation_end_date = :date_max,
                    area_hectare = GREATEST(
                        :area,
                        COALESCE(bdf_resinous_area_hectare, 0)
                        + COALESCE(bdf_deciduous_area_hectare, 0)
                        + COALESCE(bdf_mixed_area_hectare, 0)
                        + COALESCE(bdf_poplar_area_hectare, 0),
                        COALESCE(ecological_zoning_area_hectare, 0)
                    ),
                    updated_at = NOW()
                WHERE id = :id
                  AND NOT (is_manually_edited AND NOT allow_pipeline_override)
                """
            ),
            {
                "id": int(row["clear_cut_group"]),
                "boundary": row["boundary_wkt"],
                "location": row["location_wkt"],
                "date_min": row["date_min"].to_pydatetime(),
                "date_max": row["date_max"].to_pydatetime(),
                "area": float(row["area_ha"]),
            },
        )
        if result.rowcount:
            summary.updated += 1
        else:
            summary.locked += 1


def load_clusters(
    engine: Engine,
    new_clusters: gpd.GeoDataFrame,
    updated_clusters: gpd.GeoDataFrame,
    dry_run: bool = False,
) -> LoadSummary:
    summary = LoadSummary()
    with engine.connect() as conn:
        transaction = conn.begin()
        try:
            update_reference_clusters(conn, updated_clusters, summary)
            report_ids = insert_new_clusters(conn, new_clusters, summary)
        except Exception:
            transaction.rollback()
            raise
        if dry_run:
            transaction.rollback()
            logging.info("Essai sans écriture : %s", summary)
            return summary
        transaction.commit()
    logging.info("Chargement terminé : %s", summary)
    if report_ids:
        logging.info("Signalements créés : %s", report_ids)
    return summary


def sync_reports(api_url: str, imports_token: str) -> None:
    """Le backend recalcule les totaux et les règles de chaque signalement."""
    response = requests.post(
        f"{api_url.rstrip('/')}/api/v1/clear-cuts-reports/sync-reports",
        headers={"x-imports-token": imports_token},
        timeout=SYNC_TIMEOUT_SECONDS,
    )
    response.raise_for_status()


def load_database(dry_run: bool = False) -> LoadSummary:
    """Charge les fichiers de la dernière exécution, puis fait recalculer les
    signalements par le backend."""
    api_url = os.environ.get("API_URL", "")
    imports_token = os.environ.get("IMPORTS_TOKEN", "")
    if not dry_run and not (api_url and imports_token):
        # Sans recalcul, les nouveaux signalements resteraient sans totaux.
        raise RuntimeError("API_URL et IMPORTS_TOKEN sont nécessaires au chargement")

    summary = load_clusters(
        create_db_engine(os.environ["DATABASE_URL"]),
        read_clusters(NEW_CLUSTERS_PATH),
        read_clusters(UPDATED_CLUSTERS_PATH),
        dry_run=dry_run,
    )
    if not dry_run:
        sync_reports(api_url, imports_token)
        logging.info("Signalements recalculés par le backend.")
    return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="tout calculer puis annuler la transaction, sans appeler le backend",
    )
    load_database(dry_run=parser.parse_args().dry_run)
