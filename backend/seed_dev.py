import math
import os
import shutil
import traceback
from datetime import datetime, timedelta
from pathlib import Path

from geoalchemy2.shape import from_shape
from shapely.geometry import MultiPolygon, Point
from sqlalchemy import text

from app.database import Base, SessionLocal
from app.models import (
    ClearCut,
    ClearCutEcologicalZoning,
    ClearCutForm,
    ClearCutReport,
    User,
)
from app.services.clear_cut_report import sync_clear_cuts_reports
from app.services.get_password_hash import get_password_hash
from common_seed import (
    get_cities,
    seed_cities_departments,
    seed_ecological_zonings,
    seed_rules,
)

SRID = 4326

# Approximate centroids (longitude, latitude) of the forest communes seeded in
# common_seed.SEED_CITY_CODES. Used to place realistic clear-cut polygons.
COMMUNE_COORDS = {
    "sabres": (-0.728, 44.143),
    "labouheyre": (-0.918, 44.211),
    "morcenx": (-0.912, 44.033),
    "mende": (3.500, 44.518),
    "pont_de_montvert": (3.758, 44.360),
    "aubusson": (2.165, 45.957),
    "royere": (1.943, 45.838),
    "gerardmer": (6.878, 48.073),
    "la_bresse": (6.876, 48.001),
}

# Forest composition profiles expressed as fractions of area_hectare.
# Sums stay < 1 so the bdf_area_smaller_than_clear_cut_area constraint always passes.
FOREST_PROFILES = {
    "resinous": {"resinous": 0.75, "deciduous": 0.10, "mixed": 0.05, "poplar": 0.00},
    "deciduous": {"resinous": 0.05, "deciduous": 0.80, "mixed": 0.10, "poplar": 0.00},
    "mixed": {"resinous": 0.25, "deciduous": 0.25, "mixed": 0.45, "poplar": 0.00},
    "poplar": {"resinous": 0.00, "deciduous": 0.05, "mixed": 0.05, "poplar": 0.85},
    "unknown": None,
}

# Sample image bundled with the repo, reused so seeded forms display real pictures
# instead of the broken fake filenames the previous seed referenced.
UPLOADS_DIR = Path("uploads")
SAMPLE_IMAGE = UPLOADS_DIR / "67bf9395-0f14-433a-a131-7f46c52a5b19_test.jpg"


def _hex_around(lng: float, lat: float, radius: float = 0.003):
    coords = [
        (
            lng + radius * math.cos(math.radians(60 * i)),
            lat + radius * math.sin(math.radians(60 * i)),
        )
        for i in range(6)
    ]
    coords.append(coords[0])
    return coords


def make_clear_cut(
    lng: float,
    lat: float,
    area_hectare: float = 10.0,
    forest_type: str = "unknown",
    radius: float = 0.003,
    days_ago_start: int = 10,
    days_ago_end: int = 5,
    ecological_zoning_area: float | None = None,
    ecological_zonings: list | None = None,
) -> ClearCut:
    profile = FOREST_PROFILES[forest_type]
    if profile is None:
        bdf = {k: None for k in ("resinous", "deciduous", "mixed", "poplar")}
    else:
        bdf = {k: round(v * area_hectare, 3) for k, v in profile.items()}
    return ClearCut(
        observation_start_date=datetime.now() - timedelta(days=days_ago_start),
        observation_end_date=datetime.now() - timedelta(days=days_ago_end),
        area_hectare=area_hectare,
        bdf_resinous_area_hectare=bdf["resinous"],
        bdf_deciduous_area_hectare=bdf["deciduous"],
        bdf_mixed_area_hectare=bdf["mixed"],
        bdf_poplar_area_hectare=bdf["poplar"],
        ecological_zoning_area_hectare=ecological_zoning_area,
        location=from_shape(Point(lng, lat), SRID),
        boundary=from_shape(
            MultiPolygon([(_hex_around(lng, lat, radius),)]),
            srid=SRID,
        ),
        ecological_zonings=[
            ClearCutEcologicalZoning(ecological_zoning_id=z.id)
            for z in (ecological_zonings or [])
        ],
    )


def cut(
    commune: str,
    *,
    area: float,
    forest: str = "unknown",
    days_start: int,
    days_end: int,
    eco_area: float | None = None,
    zonings: list | None = None,
    dx: float = 0.0,
    dy: float = 0.0,
) -> ClearCut:
    """Build a clear cut near a named commune (with optional offset to avoid overlaps)."""
    lng, lat = COMMUNE_COORDS[commune]
    return make_clear_cut(
        lng + dx,
        lat + dy,
        area_hectare=area,
        forest_type=forest,
        days_ago_start=days_start,
        days_ago_end=days_end,
        ecological_zoning_area=eco_area,
        ecological_zonings=zonings,
    )


def seed_report_image(report_id: int, name: str) -> str | None:
    """Copy the sample image into the report folder and return its storage key.

    Returns None if the sample image is missing so seeding stays resilient.
    """
    if not SAMPLE_IMAGE.exists():
        return None
    dest_dir = UPLOADS_DIR / "reports" / str(report_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = f"seed_{name}.jpg"
    dest = dest_dir / filename
    if not dest.exists():
        shutil.copyfile(SAMPLE_IMAGE, dest)
    return f"local/reports/{report_id}/{filename}"


def wipe_database():
    env = os.environ.get("ENVIRONMENT", "development").lower()
    if env != "development" and env != "test":
        raise RuntimeError("This script should only run in development environment!")

    # Settings tables should not be wiped as they are created
    # via a migration, any change to them needs to be reflected in a migration

    db = SessionLocal()

    db_tables = Base.metadata.tables.keys()
    truncate_stmt = f"TRUNCATE TABLE {', '.join(db_tables - ['departments', 'cities'])} RESTART IDENTITY CASCADE"
    db.execute(text(truncate_stmt))
    db.commit()


def seed_database():
    db = SessionLocal()
    try:
        wipe_database()
        seed_cities_departments(db)
        cities = get_cities(db)
        zonings = seed_ecological_zonings(db)
        seed_rules(db, list(zonings.values()))

        # --- Users -------------------------------------------------------------
        # One multi-department admin, three volunteers with disjoint departments
        # (to exercise the department filter and "Actions requises"), and one
        # inactive volunteer to cover account management.
        landes = cities["sabres"].department
        lozere = cities["mende"].department
        creuse = cities["aubusson"].department
        vosges = cities["gerardmer"].department

        admin = User(
            first_name="Crysta",
            last_name="Faerie",
            login="CrystaFaerie",
            email="admin@example.com",
            role="admin",
            password=get_password_hash("admin"),
            is_active=True,
        )
        admin.departments.extend([landes, lozere, creuse, vosges])

        alice = User(
            first_name="Alice",
            last_name="Pinède",
            login="AlicePinede",
            email="volunteer@example.com",
            role="volunteer",
            password=get_password_hash("volunteer"),
            is_active=True,
        )
        alice.departments.append(landes)

        bruno = User(
            first_name="Bruno",
            last_name="Cévennes",
            login="BrunoCevennes",
            email="bruno@example.com",
            role="volunteer",
            password=get_password_hash("volunteer"),
            is_active=True,
        )
        bruno.departments.append(lozere)

        chloe = User(
            first_name="Chloé",
            last_name="Vassivière",
            login="ChloeVassiviere",
            email="chloe@example.com",
            role="volunteer",
            password=get_password_hash("volunteer"),
            is_active=True,
        )
        chloe.departments.extend([creuse, vosges])

        david = User(
            first_name="David",
            last_name="Inactif",
            login="DavidInactif",
            email="david@example.com",
            role="volunteer",
            password=get_password_hash("volunteer"),
            is_active=False,
        )
        david.departments.append(vosges)

        users = [admin, alice, bruno, chloe, david]
        db.add_all(users)
        db.flush()

        # --- Reports -----------------------------------------------------------
        # The set below covers every status, every forest profile (incl. unknown),
        # mono- and multi-cut reports, rule edge cases (area/slope/zoning above and
        # below thresholds), an unassigned report with a pending assignment request,
        # and a wide spread of cut dates (to exercise the date sort).

        # Landes (40) — pinède résineuse, faible pente
        r_sabres = ClearCutReport(
            city=cities["sabres"],
            slope_area_hectare=1.5,  # below slope threshold
            status="to_validate",
            user=alice,
            clear_cuts=[
                cut("sabres", area=12, forest="resinous", days_start=8, days_end=3),
            ],
        )
        r_labouheyre = ClearCutReport(
            city=cities["labouheyre"],
            slope_area_hectare=1.0,
            status="in_progress",
            user=alice,
            clear_cuts=[  # multi-cut, total 13 ha => area rule
                cut(
                    "labouheyre", area=7, forest="resinous", days_start=20, days_end=10
                ),
                cut(
                    "labouheyre",
                    area=6,
                    forest="resinous",
                    days_start=20,
                    days_end=10,
                    dx=0.012,
                ),
            ],
        )
        r_morcenx = ClearCutReport(
            city=cities["morcenx"],
            slope_area_hectare=0.5,
            status="waiting_for_validation",
            user=alice,
            clear_cuts=[
                cut("morcenx", area=22, forest="poplar", days_start=30, days_end=25),
            ],
        )

        # Lozère (48) — forêt mixte, forte pente, Natura 2000 Mont Lozère
        r_mende = ClearCutReport(
            city=cities["mende"],
            slope_area_hectare=14,  # slope rule
            status="legal_validated",
            user=admin,
            clear_cuts=[
                cut(
                    "mende",
                    area=18,
                    forest="mixed",
                    days_start=60,
                    days_end=50,
                    eco_area=9,
                    zonings=[zonings["lozere"]],
                ),
            ],
        )
        r_montvert = ClearCutReport(
            city=cities["pont_de_montvert"],
            slope_area_hectare=8,
            status="validated",
            user=bruno,
            clear_cuts=[  # multi-cut, one inside the protected zone
                cut(
                    "pont_de_montvert",
                    area=9,  # below area threshold on its own
                    forest="mixed",
                    days_start=45,
                    days_end=30,
                    eco_area=6,
                    zonings=[zonings["lozere"]],
                ),
                cut(
                    "pont_de_montvert",
                    area=4,
                    forest="mixed",
                    days_start=45,
                    days_end=30,
                    dx=0.012,
                ),
            ],
        )
        r_mende_request = ClearCutReport(
            city=cities["mende"],
            slope_area_hectare=3,
            status="to_validate",
            user=None,  # unassigned, awaiting admin approval
            assignment_requested_by=bruno,
            clear_cuts=[
                cut(
                    "mende",
                    area=8,
                    forest="mixed",
                    days_start=5,
                    days_end=1,
                    eco_area=2,
                    zonings=[zonings["lozere"]],
                    dx=0.02,
                    dy=0.015,
                ),
            ],
        )

        # Creuse (23) — feuillus
        r_aubusson = ClearCutReport(
            city=cities["aubusson"],
            slope_area_hectare=1.2,  # below threshold
            status="final_validated",
            user=chloe,
            clear_cuts=[  # small, low slope, no zoning => no rule matched (clean case)
                cut("aubusson", area=6, forest="deciduous", days_start=90, days_end=85),
            ],
        )
        r_aubusson_unknown = ClearCutReport(
            city=cities["aubusson"],
            slope_area_hectare=2.5,
            status="to_validate",
            user=chloe,
            clear_cuts=[  # unknown forest type => bdf areas are NULL
                cut(
                    "aubusson",
                    area=11,
                    forest="unknown",
                    days_start=7,
                    days_end=2,
                    dx=0.02,
                    dy=0.015,
                ),
            ],
        )
        r_royere = ClearCutReport(
            city=cities["royere"],
            slope_area_hectare=2.0,
            status="rejected",
            user=admin,
            clear_cuts=[  # false positive from the satellite pipeline
                cut("royere", area=5, forest="deciduous", days_start=100, days_end=95),
            ],
        )

        # Vosges (88) — mixte/résineux, forte pente, Natura 2000 massif vosgien
        r_gerardmer = ClearCutReport(
            city=cities["gerardmer"],
            slope_area_hectare=16,
            status="waiting_for_validation",
            user=chloe,
            clear_cuts=[
                cut(
                    "gerardmer",
                    area=25,
                    forest="resinous",
                    days_start=25,
                    days_end=20,
                    eco_area=10,
                    zonings=[zonings["vosges"]],
                ),
            ],
        )
        r_labresse = ClearCutReport(
            city=cities["la_bresse"],
            slope_area_hectare=20,
            status="legal_validated",
            user=admin,
            clear_cuts=[  # multi-cut, large, in protected zone
                cut(
                    "la_bresse",
                    area=15,
                    forest="resinous",
                    days_start=70,
                    days_end=60,
                    eco_area=8,
                    zonings=[zonings["vosges"]],
                ),
                cut(
                    "la_bresse",
                    area=10,
                    forest="mixed",
                    days_start=70,
                    days_end=60,
                    dx=0.014,
                ),
            ],
        )
        r_gerardmer_progress = ClearCutReport(
            city=cities["gerardmer"],
            slope_area_hectare=5,
            status="in_progress",
            user=chloe,
            clear_cuts=[
                cut(
                    "gerardmer",
                    area=12,
                    forest="mixed",
                    days_start=18,
                    days_end=12,
                    dx=0.02,
                    dy=0.015,
                ),
            ],
        )
        r_labresse_small = ClearCutReport(
            city=cities["la_bresse"],
            slope_area_hectare=1,
            status="final_validated",
            user=admin,
            clear_cuts=[  # small, below every threshold
                cut(
                    "la_bresse",
                    area=4,
                    forest="resinous",
                    days_start=80,
                    days_end=75,
                    dx=0.02,
                    dy=0.015,
                ),
            ],
        )
        r_royere_rejected = ClearCutReport(
            city=cities["royere"],
            slope_area_hectare=1,
            status="rejected",
            user=admin,
            clear_cuts=[
                cut(
                    "royere",
                    area=3,
                    forest="poplar",
                    days_start=120,
                    days_end=115,
                    dx=0.02,
                    dy=0.015,
                ),
            ],
        )

        reports = [
            r_sabres,
            r_labouheyre,
            r_morcenx,
            r_mende,
            r_montvert,
            r_mende_request,
            r_aubusson,
            r_aubusson_unknown,
            r_royere,
            r_gerardmer,
            r_labresse,
            r_gerardmer_progress,
            r_labresse_small,
            r_royere_rejected,
        ]
        db.add_all(reports)

        # --- Favorites ---------------------------------------------------------
        alice.favorites.append(r_sabres)
        bruno.favorites.append(r_montvert)
        admin.favorites.extend([r_labresse, r_mende])

        db.flush()

        # --- Forms -------------------------------------------------------------
        # Two fully-filled forms, one partial draft. Image fields point to real
        # files copied into each report's upload folder so they actually render.
        full_forms = [
            ClearCutForm(
                report_id=r_mende.id,
                editor_id=admin.id,
                inspection_date=datetime.now() - timedelta(days=48),
                weather="Ensoleillé",
                forest="Hêtraie-sapinière de montagne",
                has_remaining_trees=False,
                trees_species="Fagus sylvatica, Abies alba",
                planting_images=[seed_report_image(r_mende.id, "planting")],
                has_construction_panel=True,
                construction_panel_images=[seed_report_image(r_mende.id, "panel")],
                wetland="Non",
                destruction_clues="Sol fortement tassé, ornières profondes",
                soil_state="Dégradé",
                clear_cut_images=[seed_report_image(r_mende.id, "clearcut")],
                tree_trunks_images=[seed_report_image(r_mende.id, "trunks")],
                soil_state_images=[seed_report_image(r_mende.id, "soil")],
                access_road_images=[seed_report_image(r_mende.id, "road")],
                has_other_ecological_zone=True,
                other_ecological_zone_type="ZNIEFF",
                has_nearby_ecological_zone=True,
                nearby_ecological_zone_type="Natura 2000 (Mont Lozère)",
                protected_species="Grand tétras",
                protected_habitats="Tourbières de montagne",
                has_ddt_request=True,
                ddt_request_owner="DDT 48",
                company="Scierie du Gévaudan",
                subcontractor="Travaux Forestiers Lozère",
                landlord="Groupement Forestier du Mont Lozère",
                is_pefc_fsc_certified=False,
                is_over_20_ha=False,
                is_psg_required_plot=True,
                relevant_for_pefc_complaint=False,
                relevant_for_rediii_complaint=True,
                relevant_for_ofb_complaint=True,
                relevant_for_alert_cnpf_ddt_srgs=True,
                relevant_for_alert_cnpf_ddt_psg_thresholds=True,
                relevant_for_psg_request=True,
                request_engaged="Signalement OFB en cours",
                other="Coupe en zone Natura 2000, forte pente, à suivre en priorité",
            ),
            ClearCutForm(
                report_id=r_labresse.id,
                editor_id=admin.id,
                inspection_date=datetime.now() - timedelta(days=58),
                weather="Couvert",
                forest="Pessière (épicéa)",
                has_remaining_trees=True,
                trees_species="Picea abies",
                planting_images=[seed_report_image(r_labresse.id, "planting")],
                has_construction_panel=False,
                construction_panel_images=[],
                wetland="Non",
                destruction_clues="Aucun indice particulier",
                soil_state="Correct",
                clear_cut_images=[seed_report_image(r_labresse.id, "clearcut")],
                tree_trunks_images=[seed_report_image(r_labresse.id, "trunks")],
                soil_state_images=[],
                access_road_images=[seed_report_image(r_labresse.id, "road")],
                has_other_ecological_zone=False,
                other_ecological_zone_type=None,
                has_nearby_ecological_zone=True,
                nearby_ecological_zone_type="Massif vosgien",
                protected_species="Aucune observée",
                protected_habitats="Aucun",
                has_ddt_request=False,
                ddt_request_owner=None,
                company="Exploitation Forestière des Hautes-Vosges",
                subcontractor=None,
                landlord="Commune de La Bresse",
                is_pefc_fsc_certified=True,
                is_over_20_ha=True,
                is_psg_required_plot=True,
                relevant_for_pefc_complaint=True,
                relevant_for_rediii_complaint=False,
                relevant_for_ofb_complaint=False,
                relevant_for_alert_cnpf_ddt_srgs=False,
                relevant_for_alert_cnpf_ddt_psg_thresholds=True,
                relevant_for_psg_request=False,
                request_engaged="Plainte PEFC déposée",
                other="Coupe > 20 ha en zone protégée",
            ),
        ]

        # Partial draft (volunteer started filling the form while in progress)
        draft_form = ClearCutForm(
            report_id=r_labouheyre.id,
            editor_id=alice.id,
            inspection_date=datetime.now() - timedelta(days=9),
            weather="Ensoleillé",
            forest="Pin maritime",
            has_remaining_trees=False,
            trees_species="Pinus pinaster",
            clear_cut_images=[seed_report_image(r_labouheyre.id, "clearcut")],
        )

        db.add_all([*full_forms, draft_form])

        sync_clear_cuts_reports(db)

        db.commit()

        print(f"Added {len(users)} users to the database")
        print(f"Added {len(reports)} clear cut reports to the database")
        print(f"Added {len(full_forms) + 1} clear cut forms to the database")
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        print(traceback.format_exc())
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
