import math
import os
import traceback
from datetime import datetime, timedelta

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

# Forest composition profiles expressed as fractions of area_hectare.
# Sums stay < 1 so the bdf_area_smaller_than_clear_cut_area constraint always passes.
FOREST_PROFILES = {
    "resinous": {"resinous": 0.75, "deciduous": 0.10, "mixed": 0.05, "poplar": 0.00},
    "deciduous": {"resinous": 0.05, "deciduous": 0.80, "mixed": 0.10, "poplar": 0.00},
    "mixed": {"resinous": 0.25, "deciduous": 0.25, "mixed": 0.45, "poplar": 0.00},
    "poplar": {"resinous": 0.00, "deciduous": 0.05, "mixed": 0.05, "poplar": 0.85},
    "unknown": None,
}


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
        [marseille, paris] = get_cities(db)
        [natura1, natura2] = seed_ecological_zonings(db)
        seed_rules(db, [natura1, natura2])
        admin = User(
            first_name="Crysta",
            last_name="Faerie",
            login="CrystaFaerie",
            email="admin@example.com",
            role="admin",
            password=get_password_hash("admin"),
            is_active=True,
        )
        volunteer = User(
            first_name="Pips",
            last_name="Sprite",
            login="PipsSprite",
            email="volunteer@example.com",
            role="volunteer",
            password=get_password_hash("volunteer"),
            is_active=True,
        )

        admin.departments.append(paris.department)
        volunteer.departments.append(paris.department)
        users = [admin, volunteer]
        db.add_all(users)
        db.flush()

        clear_cuts = [
            ClearCutReport(
                city=paris,
                slope_area_hectare=15,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=10),
                        observation_end_date=datetime.now() - timedelta(days=5),
                        area_hectare=10,
                        bdf_resinous_area_hectare=0.5,
                        bdf_deciduous_area_hectare=0.5,
                        bdf_mixed_area_hectare=0.5,
                        bdf_poplar_area_hectare=0.5,
                        ecological_zoning_area_hectare=5,
                        location=from_shape(Point(2.380192, 48.878899), SRID),
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (2.381136, 48.881707),
                                            (2.379699, 48.880338),
                                            (2.378497, 48.878687),
                                            (2.378561, 48.877615),
                                            (2.379162, 48.876825),
                                            (2.381094, 48.876175),
                                            (2.380879, 48.877573),
                                            (2.382145, 48.8788),
                                            (2.384012, 48.879407),
                                            (2.383454, 48.880127),
                                            (2.381694, 48.880042),
                                            (2.381372, 48.880973),
                                            (2.381136, 48.881707),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                        ecological_zonings=[
                            ClearCutEcologicalZoning(ecological_zoning_id=natura1.id),
                            ClearCutEcologicalZoning(ecological_zoning_id=natura2.id),
                        ],
                    ),
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=10),
                        observation_end_date=datetime.now() - timedelta(days=5),
                        area_hectare=10,
                        ecological_zoning_area_hectare=0.3,
                        bdf_resinous_area_hectare=0.5,
                        bdf_deciduous_area_hectare=0.5,
                        bdf_mixed_area_hectare=0.5,
                        bdf_poplar_area_hectare=0.5,
                        location=from_shape(Point(1.380192, 48.878899), SRID),
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (2.381136, 48.881707),
                                            (2.379699, 48.880338),
                                            (2.378497, 48.878687),
                                            (2.378561, 48.877615),
                                            (2.379162, 48.876825),
                                            (2.381094, 48.876175),
                                            (2.380879, 48.877573),
                                            (2.382145, 48.8788),
                                            (2.384012, 48.879407),
                                            (2.383454, 48.880127),
                                            (2.381694, 48.880042),
                                            (2.381372, 48.880973),
                                            (2.381136, 48.881707),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                        ecological_zonings=[
                            ClearCutEcologicalZoning(ecological_zoning_id=natura1.id),
                        ],
                    ),
                ],
                status="to_validate",
                user=volunteer,
            ),
            ClearCutReport(
                city=paris,
                slope_area_hectare=10,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=5),
                        observation_end_date=datetime.now() - timedelta(days=2),
                        area_hectare=10,
                        location=from_shape(Point(2.371101, 48.839001), SRID),
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (2.375342, 48.832582),
                                            (2.376072, 48.832286),
                                            (2.376823, 48.831277),
                                            (2.376898, 48.830677),
                                            (2.376308, 48.83012),
                                            (2.375921, 48.830134),
                                            (2.375331, 48.830748),
                                            (2.375514, 48.83175),
                                            (2.375342, 48.832554),
                                            (2.375342, 48.832582),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                        ecological_zonings=[],
                    ),
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=15),
                        observation_end_date=datetime.now() - timedelta(days=2),
                        area_hectare=13,
                        location=from_shape(Point(2.381101, 48.839001), SRID),
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (2.385342, 48.842582),
                                            (2.386072, 48.842286),
                                            (2.386823, 48.841277),
                                            (2.386898, 48.840677),
                                            (2.386308, 48.84012),
                                            (2.385921, 48.840134),
                                            (2.385331, 48.840748),
                                            (2.385514, 48.84175),
                                            (2.385342, 48.842554),
                                            (2.385342, 48.842582),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                        ecological_zonings=[],
                    ),
                ],
                status="validated",
                user=admin,
            ),
            ClearCutReport(
                city=marseille,
                slope_area_hectare=6.8,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=5),
                        observation_end_date=datetime.now() - timedelta(days=2),
                        area_hectare=10,
                        location=from_shape(
                            Point(5.3698, 43.2965), SRID
                        ),  # Coordonnées approximatives de Marseille
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (5.3708, 43.3005),
                                            (5.3688, 43.2995),
                                            (5.3678, 43.2975),
                                            (5.3688, 43.2955),
                                            (5.3708, 43.2945),
                                            (5.3728, 43.2965),
                                            (5.3708, 43.3005),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                    )
                ],
                status="validated",
                user=admin,
            ),
            ClearCutReport(
                city=marseille,
                slope_area_hectare=4.2,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=15),
                        observation_end_date=datetime.now() - timedelta(days=9),
                        area_hectare=10,
                        location=from_shape(
                            Point(5.4008, 43.2865), SRID
                        ),  # Autour de Marseille
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (5.4018, 43.2905),
                                            (5.3998, 43.2895),
                                            (5.3988, 43.2875),
                                            (5.3998, 43.2855),
                                            (5.4018, 43.2845),
                                            (5.4038, 43.2865),
                                            (5.4018, 43.2905),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                    )
                ],
                status="validated",
                user=admin,
            ),
            ClearCutReport(
                city=marseille,
                slope_area_hectare=5.7,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=10),
                        observation_end_date=datetime.now() - timedelta(days=9),
                        area_hectare=10,
                        location=from_shape(
                            Point(5.3508, 43.3165), SRID
                        ),  # Autour de Marseille
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (5.3518, 43.3205),
                                            (5.3498, 43.3195),
                                            (5.3488, 43.3175),
                                            (5.3498, 43.3155),
                                            (5.3518, 43.3145),
                                            (5.3538, 43.3165),
                                            (5.3518, 43.3205),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                    )
                ],
                status="to_validate",
                user=volunteer,
            ),
            ClearCutReport(
                city=marseille,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=30),
                        observation_end_date=datetime.now() - timedelta(days=9),
                        area_hectare=10,
                        location=from_shape(
                            Point(5.3808, 43.2765), SRID
                        ),  # Autour de Marseille
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (5.3818, 43.2805),
                                            (5.3798, 43.2795),
                                            (5.3788, 43.2775),
                                            (5.3798, 43.2755),
                                            (5.3818, 43.2745),
                                            (5.3838, 43.2765),
                                            (5.3818, 43.2805),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                    )
                ],
                slope_area_hectare=8.1,
                status="validated",
                user=admin,
            ),
            ClearCutReport(
                city=marseille,
                clear_cuts=[
                    ClearCut(
                        observation_start_date=datetime.now() - timedelta(days=2),
                        observation_end_date=datetime.now() - timedelta(days=1),
                        area_hectare=10,
                        location=from_shape(
                            Point(5.3908, 43.2665), SRID
                        ),  # Autour de Marseille
                        boundary=from_shape(
                            MultiPolygon(
                                [
                                    (
                                        [
                                            (5.3918, 43.2705),
                                            (5.3898, 43.2695),
                                            (5.3888, 43.2675),
                                            (5.3898, 43.2655),
                                            (5.3918, 43.2645),
                                            (5.3938, 43.2665),
                                            (5.3918, 43.2705),
                                        ],
                                    )
                                ]
                            ),
                            srid=SRID,
                        ),
                    )
                ],
                slope_area_hectare=3.9,
                status="to_validate",
                user=volunteer,
            ),
        ]

        # --- Extra fixtures: cover every status and every forest profile ---
        # Coordinates are picked away from the originals to avoid overlapping polygons.
        extra_reports = [
            # in_progress — admin took the file, large resineux around Marseille
            ClearCutReport(
                city=marseille,
                slope_area_hectare=12,
                status="in_progress",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        5.43,
                        43.30,
                        area_hectare=15,
                        forest_type="resinous",
                        days_ago_start=20,
                        days_ago_end=15,
                    ),
                ],
            ),
            # in_progress — volunteer is filling the form for a feuillus cut
            ClearCutReport(
                city=paris,
                slope_area_hectare=3,
                status="in_progress",
                user=volunteer,
                clear_cuts=[
                    make_clear_cut(
                        2.42,
                        48.88,
                        area_hectare=8,
                        forest_type="deciduous",
                        days_ago_start=18,
                        days_ago_end=12,
                    ),
                ],
            ),
            # waiting_for_validation — mixed forest submitted by a volunteer
            ClearCutReport(
                city=marseille,
                slope_area_hectare=7,
                status="waiting_for_validation",
                user=volunteer,
                clear_cuts=[
                    make_clear_cut(
                        5.33,
                        43.30,
                        area_hectare=12,
                        forest_type="mixed",
                        days_ago_start=25,
                        days_ago_end=20,
                    ),
                ],
            ),
            # waiting_for_validation — large peupleraie awaiting admin review
            ClearCutReport(
                city=marseille,
                slope_area_hectare=2,
                status="waiting_for_validation",
                user=volunteer,
                clear_cuts=[
                    make_clear_cut(
                        5.45,
                        43.28,
                        area_hectare=20,
                        forest_type="poplar",
                        days_ago_start=30,
                        days_ago_end=25,
                    ),
                ],
            ),
            # legal_validated — coupe in a Natura2000 zone, large resineux
            ClearCutReport(
                city=marseille,
                slope_area_hectare=15,
                status="legal_validated",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        5.31,
                        43.28,
                        area_hectare=25,
                        forest_type="resinous",
                        days_ago_start=60,
                        days_ago_end=50,
                        ecological_zoning_area=8,
                        ecological_zonings=[natura1],
                    ),
                ],
            ),
            # legal_validated — mixed forest intersecting two protected zones
            ClearCutReport(
                city=paris,
                slope_area_hectare=20,
                status="legal_validated",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        2.34,
                        48.85,
                        area_hectare=18,
                        forest_type="mixed",
                        days_ago_start=45,
                        days_ago_end=40,
                        ecological_zoning_area=10,
                        ecological_zonings=[natura1, natura2],
                    ),
                ],
            ),
            # final_validated — small feuillus, nothing to pursue
            ClearCutReport(
                city=marseille,
                slope_area_hectare=4,
                status="final_validated",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        5.33,
                        43.32,
                        area_hectare=6,
                        forest_type="deciduous",
                        days_ago_start=90,
                        days_ago_end=85,
                    ),
                ],
            ),
            # final_validated — small resineux, low slope, no thresholds hit
            ClearCutReport(
                city=paris,
                slope_area_hectare=1,
                status="final_validated",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        2.42,
                        48.85,
                        area_hectare=4,
                        forest_type="resinous",
                        days_ago_start=80,
                        days_ago_end=75,
                    ),
                ],
            ),
            # rejected — small peupleraie, declared not relevant
            ClearCutReport(
                city=marseille,
                slope_area_hectare=1,
                status="rejected",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        5.45,
                        43.32,
                        area_hectare=3,
                        forest_type="poplar",
                        days_ago_start=120,
                        days_ago_end=115,
                    ),
                ],
            ),
            # rejected — feuillus, false positive from the satellite pipeline
            ClearCutReport(
                city=paris,
                slope_area_hectare=2,
                status="rejected",
                user=admin,
                clear_cuts=[
                    make_clear_cut(
                        2.42,
                        48.84,
                        area_hectare=5,
                        forest_type="deciduous",
                        days_ago_start=100,
                        days_ago_end=95,
                    ),
                ],
            ),
            # to_validate — unassigned, the volunteer has requested the assignment
            ClearCutReport(
                city=marseille,
                slope_area_hectare=5,
                status="to_validate",
                user=None,
                assignment_requested_by=volunteer,
                clear_cuts=[
                    make_clear_cut(
                        5.45,
                        43.26,
                        area_hectare=7,
                        forest_type="mixed",
                        days_ago_start=3,
                        days_ago_end=1,
                    ),
                ],
            ),
        ]
        clear_cuts.extend(extra_reports)
        db.add_all(clear_cuts)

        db.flush()

        reportform = ClearCutForm(
            report_id=clear_cuts[0].id,
            editor_id=admin.id,
            inspection_date=datetime.now(),
            weather="Sunny",
            forest="Dense pine forest",
            has_remaining_trees=True,
            trees_species="Pinus sylvestris",
            planting_images=["planting_image_1.jpg", "planting_image_2.jpg"],
            has_construction_panel=False,
            construction_panel_images=[
                "construction_panel_image_1.jpg",
                "construction_panel_image_2.jpg",
            ],
            wetland="Yes",
            destruction_clues="None",
            soil_state="Healthy",
            clear_cut_images=["clear_cut_image_1.jpg", "clear_cut_image_2.jpg"],
            tree_trunks_images=["tree_trunks_image_1.jpg", "tree_trunks_image_2.jpg"],
            soil_state_images=["soil_state_image_1.jpg", "soil_state_image_2.jpg"],
            access_road_images=["access_road_image_1.jpg", "access_road_image_2.jpg"],
            # Ecological informations
            has_other_ecological_zone=False,
            other_ecological_zone_type="N/A",
            has_nearby_ecological_zone=True,
            nearby_ecological_zone_type="Wetland",
            protected_species="None",
            protected_habitats="None",
            has_ddt_request=False,
            ddt_request_owner="N/A",
            # Stakeholders
            company="EcoTree",
            subcontractor="TreeServices",
            landlord="John Doe",
            # Reglementation
            is_pefc_fsc_certified=True,
            is_over_20_ha=False,
            is_psg_required_plot=True,
            # Legal strategy
            relevant_for_pefc_complaint=False,
            relevant_for_rediii_complaint=False,
            relevant_for_ofb_complaint=False,
            relevant_for_alert_cnpf_ddt_srgs=False,
            relevant_for_alert_cnpf_ddt_psg_thresholds=False,
            relevant_for_psg_request=False,
            request_engaged="None",
            # Miscellaneous
            other="No additional information",
        )

        db.add(reportform)

        sync_clear_cuts_reports(db)

        db.commit()

        print(f"Added {len(users)} users to the database")
        print(f"Added {len(clear_cuts)} clear cut reports to the database")
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        print(traceback.format_exc())
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
