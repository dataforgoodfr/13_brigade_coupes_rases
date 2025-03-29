from datetime import datetime, timedelta
import os
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, MultiPolygon
from app.database import Base, SessionLocal
from app.models import User, ClearCut
from sqlalchemy import text
import traceback

from app.services.user_auth import get_password_hash
from common_seed import seed_cities_departments, seed_ecological_zonings, seed_registries

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
        [marseille, paris] = seed_registries(db)
        seed_ecological_zonings(db)
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
            ClearCut(
                cut_date=datetime.now() - timedelta(days=10),
                slope_percentage=15.5,
                area_hectare=10,
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
                status="to_validate",
                user=volunteer,
                registries=paris.registries,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=5),
                slope_percentage=8.3,
                area_hectare=10,
                location=from_shape(Point(2.386007, 48.880959), SRID),
                boundary=from_shape(
                    MultiPolygon(
                        [
                            (
                                [
                                    (2.385342, 48.882582),
                                    (2.386072, 48.882286),
                                    (2.386823, 48.881277),
                                    (2.386898, 48.880677),
                                    (2.386308, 48.88012),
                                    (2.385921, 48.880134),
                                    (2.385331, 48.880748),
                                    (2.385514, 48.88175),
                                    (2.385342, 48.882554),
                                    (2.385342, 48.882582),
                                ],
                            )
                        ]
                    ),
                    srid=SRID,
                ),
                status="validated",
                registries=paris.registries,
                user=admin,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=20),
                slope_percentage=12.7,
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
                status="to_validate",
                registries=marseille.registries,
                user=volunteer,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=15),
                slope_percentage=9.2,
                area_hectare=10,
                location=from_shape(Point(5.4008, 43.2865), SRID),  # Autour de Marseille
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
                status="validated",
                registries=marseille.registries,
                user=admin,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=10),
                slope_percentage=7.5,
                area_hectare=10,
                location=from_shape(Point(5.3508, 43.3165), SRID),  # Autour de Marseille
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
                status="to_validate",
                registries=marseille.registries,
                user=volunteer,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=5),
                slope_percentage=14.3,
                area_hectare=10,
                location=from_shape(Point(5.3808, 43.2765), SRID),  # Autour de Marseille
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
                status="validated",
                registries=marseille.registries,
                user=admin,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=2),
                slope_percentage=10.8,
                area_hectare=10,
                location=from_shape(Point(5.3908, 43.2665), SRID),  # Autour de Marseille
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
                status="to_validate",
                registries=marseille.registries,
                user=volunteer,
            ),
        ]
        db.add_all(clear_cuts)

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
