from datetime import datetime, timedelta
import os
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, Polygon
from app.database import Base, SessionLocal
from app.models import User, Department, ClearCut
from sqlalchemy import text


def wipe_database():
    env = os.environ.get("ENVIRONMENT", "development")
    if env.lower() != "development":
        raise RuntimeError("This script should only run in development environment!")

    db = SessionLocal()

    db_tables = Base.metadata.tables.keys()
    truncate_stmt = f"TRUNCATE TABLE {', '.join(db_tables)} RESTART IDENTITY CASCADE"
    db.execute(text(truncate_stmt))
    db.commit()


def seed_database():
    db = SessionLocal()
    try:
        wipe_database()

        paris = Department(code=75)
        departments = [paris]
        db.add_all(departments)
        db.flush()

        admin = User(
            firstname="Crysta", lastname="Faerie", email="admin@example.com", role="admin"
        )
        volunteer = User(
            firstname="Pips", lastname="Sprite", email="volunteer@example.com", role="volunteer"
        )
        viewer = User(
            firstname="Batty", lastname="Koda", email="viewer@example.com", role="viewer"
        )

        admin.departments.append(paris)
        volunteer.departments.append(paris)
        viewer.departments.append(paris)
        users = [admin, volunteer, viewer]
        db.add_all(users)
        db.flush()

        clear_cuts = [
            ClearCut(
                cut_date=datetime.now() - timedelta(days=10),
                slope_percentage=15.5,
                location=from_shape(Point(2.380192, 48.878899)),
                boundary=from_shape(
                    Polygon(
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
                        ]
                    )
                ),
                status="pending",
                department_id=paris.id,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=5),
                slope_percentage=8.3,
                location=from_shape(Point(2.386007, 48.880959)),
                boundary=from_shape(
                    Polygon(
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
                        ]
                    )
                ),
                status="validated",
                department_id=paris.id,
            ),
        ]
        db.add_all(clear_cuts)

        clear_cuts[0].users.extend([admin, volunteer])
        clear_cuts[1].users.extend([viewer, volunteer])

        db.commit()

        print(f"Added {len(users)} users to the database")
        print(f"Added {len(departments)} departments to the database")
        print(f"Added {len(clear_cuts)} clear cuts to the database")
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
