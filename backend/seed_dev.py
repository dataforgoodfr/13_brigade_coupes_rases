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
            firstname="Crysta",
            lastname="Faerie",
            login="CrystaFaerie",
            email="admin@example.com",
            role="admin",
            password=get_password_hash("admin"),
        )
        volunteer = User(
            firstname="Pips",
            lastname="Sprite",
            login="PipsSprite",
            email="volunteer@example.com",
            role="volunteer",
            password=get_password_hash("volunteer"),
        )

        admin.departments.append(paris.department)
        volunteer.departments.append(paris.department)
        users = [admin, volunteer]
        db.add_all(users)
        db.flush()

        clear_cuts = [
            ClearCutReport(
                city=paris,
                slope_area_ratio_percentage=10.5,
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
                slope_area_ratio_percentage=10.5,
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
                city=paris,
                slope_area_ratio_percentage=10.5,
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
                slope_area_ratio_percentage=10.5,
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
                slope_area_ratio_percentage=10.5,
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
                slope_area_ratio_percentage=14.3,
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
                slope_area_ratio_percentage=10.8,
                status="to_validate",
                user=volunteer,
            ),
        ]
        db.add_all(clear_cuts)

        db.flush()

        reportform = ClearCutForm(
            report_id=clear_cuts[0].id,
            editor_id=admin.id,
            created_at=datetime.now() - timedelta(days=2),
            inspection_date=datetime.now(),
            weather="Rainy",
            forest_description="C'était une belle fôret où coulaient rivière et riaient oiseaux",
            remainingTrees=False,
            species="Pins centenaires",
            workSignVisible=False,
            waterzone_description="Lac",
            protected_zone_description="RAS",
            soil_state="Ravagé",
            other="C'est un bien triste constat",
            ecological_zone=False,
            ecological_zone_type="RAS",
            nearby_zone="RAS",
            nearby_zone_type="RAS",
            protected_species="Le pin",
            protected_habitats="Coucou endémique",
            ddt_request=False,
            ddt_request_owner="Manu",
            compagny="A Corp",
            subcontractor=None,
            landlord="B. Arnault",
            pefc_fsc_certified=None,
            over_20_ha=True,
            psg_required_plot=True,
            relevant_for_pefc_complaint=True,
            relevant_for_rediii_complaint=True,
            relevant_for_ofb_complaint=True,
            relevant_for_alert_cnpf_ddt_srgs=True,
            relevant_for_alert_cnpf_ddt_psg_thresholds=True,
            relevant_for_psg_request=True,
            request_engaged="Plainte à déposer à la Mairie de la Penne",
        )

        db.add(reportform)

        sync_clear_cuts_reports(db)

        db.commit()

        print(f"Added {len(users)} users to the database")
        print(f"Added {len(clear_cuts)} clear cuts to the database")
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        print(traceback.format_exc())
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
