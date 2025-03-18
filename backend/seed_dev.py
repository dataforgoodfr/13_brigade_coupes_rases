from datetime import datetime, timedelta
import os
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, Polygon
from app.database import Base, SessionLocal
from app.models import User, Department, ClearCut
from sqlalchemy import text

SRID = 4326


def wipe_database():
    env = os.environ.get("ENVIRONMENT", "development")
    if env.lower() != "development":
        raise RuntimeError("This script should only run in development environment!")

    # Settings tables should not be wiped as they are created
    # via a migration, any change to them needs to be reflected in a migration
    SETTINGS_TABLES = ["departments"]

    db = SessionLocal()

    db_tables = Base.metadata.tables.keys()
    truncate_stmt = (
        f"TRUNCATE TABLE {', '.join(db_tables - SETTINGS_TABLES)} RESTART IDENTITY CASCADE"
    )
    db.execute(text(truncate_stmt))
    db.commit()


def seed_database():
    db = SessionLocal()
    try:
        wipe_database()

        all_departments = [
            Department(code="01", name="Ain"),
            Department(code="02", name="Aisne"),
            Department(code="03", name="Allier"),
            Department(code="04", name="Alpes-de-Haute-Provence"),
            Department(code="05", name="Hautes-Alpes"),
            Department(code="06", name="Alpes-Maritimes"),
            Department(code="07", name="Ardèche"),
            Department(code="08", name="Ardennes"),
            Department(code="09", name="Ariège"),
            Department(code="10", name="Aube"),
            Department(code="11", name="Aude"),
            Department(code="12", name="Aveyron"),
            Department(code="13", name="Bouches-du-Rhône"),
            Department(code="14", name="Calvados"),
            Department(code="15", name="Cantal"),
            Department(code="16", name="Charente"),
            Department(code="17", name="Charente-Maritime"),
            Department(code="18", name="Cher"),
            Department(code="19", name="Corrèze"),
            Department(code="21", name="Côte-d'Or"),
            Department(code="22", name="Côtes-d'Armor"),
            Department(code="23", name="Creuse"),
            Department(code="24", name="Dordogne"),
            Department(code="25", name="Doubs"),
            Department(code="26", name="Drôme"),
            Department(code="27", name="Eure"),
            Department(code="28", name="Eure-et-Loir"),
            Department(code="29", name="Finistère"),
            Department(code="2A", name="Corse-du-Sud"),
            Department(code="2B", name="Haute-Corse"),
            Department(code="30", name="Gard"),
            Department(code="31", name="Haute-Garonne"),
            Department(code="32", name="Gers"),
            Department(code="33", name="Gironde"),
            Department(code="34", name="Hérault"),
            Department(code="35", name="Ille-et-Vilaine"),
            Department(code="36", name="Indre"),
            Department(code="37", name="Indre-et-Loire"),
            Department(code="38", name="Isère"),
            Department(code="39", name="Jura"),
            Department(code="40", name="Landes"),
            Department(code="41", name="Loir-et-Cher"),
            Department(code="42", name="Loire"),
            Department(code="43", name="Haute-Loire"),
            Department(code="44", name="Loire-Atlantique"),
            Department(code="45", name="Loiret"),
            Department(code="46", name="Lot"),
            Department(code="47", name="Lot-et-Garonne"),
            Department(code="48", name="Lozère"),
            Department(code="49", name="Maine-et-Loire"),
            Department(code="50", name="Manche"),
            Department(code="51", name="Marne"),
            Department(code="52", name="Haute-Marne"),
            Department(code="53", name="Mayenne"),
            Department(code="54", name="Meurthe-et-Moselle"),
            Department(code="55", name="Meuse"),
            Department(code="56", name="Morbihan"),
            Department(code="57", name="Moselle"),
            Department(code="58", name="Nièvre"),
            Department(code="59", name="Nord"),
            Department(code="60", name="Oise"),
            Department(code="61", name="Orne"),
            Department(code="62", name="Pas-de-Calais"),
            Department(code="63", name="Puy-de-Dôme"),
            Department(code="64", name="Pyrénées-Atlantiques"),
            Department(code="65", name="Hautes-Pyrénées"),
            Department(code="66", name="Pyrénées-Orientales"),
            Department(code="67", name="Bas-Rhin"),
            Department(code="68", name="Haut-Rhin"),
            Department(code="69", name="Rhône"),
            Department(code="70", name="Haute-Saône"),
            Department(code="71", name="Saône-et-Loire"),
            Department(code="72", name="Sarthe"),
            Department(code="73", name="Savoie"),
            Department(code="74", name="Haute-Savoie"),
            Department(code="75", name="Paris"),
            Department(code="76", name="Seine-Maritime"),
            Department(code="77", name="Seine-et-Marne"),
            Department(code="78", name="Yvelines"),
            Department(code="79", name="Deux-Sèvres"),
            Department(code="80", name="Somme"),
            Department(code="81", name="Tarn"),
            Department(code="82", name="Tarn-et-Garonne"),
            Department(code="83", name="Var"),
            Department(code="84", name="Vaucluse"),
            Department(code="85", name="Vendée"),
            Department(code="86", name="Vienne"),
            Department(code="87", name="Haute-Vienne"),
            Department(code="88", name="Vosges"),
            Department(code="89", name="Yonne"),
            Department(code="90", name="Territoire de Belfort"),
            Department(code="91", name="Essonne"),
            Department(code="92", name="Hauts-de-Seine"),
            Department(code="93", name="Seine-Saint-Denis"),
            Department(code="94", name="Val-de-Marne"),
            Department(code="95", name="Val-d'Oise"),
            Department(code="971", name="Guadeloupe"),
            Department(code="972", name="Martinique"),
            Department(code="973", name="Guyane"),
            Department(code="974", name="La Réunion"),
            Department(code="976", name="Mayotte"),
        ]

        paris = next(department for department in all_departments if department.code == "75")
        marseille = next(
            department for department in all_departments if department.code == "13"
        )
        marseille = next(
            department for department in all_departments if department.code == "13"
        )
        db.add_all(all_departments)
        db.flush()

        admin = User(
            firstname="Crysta",
            lastname="Faerie",
            email="admin@example.com",
            role="admin",
        )
        volunteer = User(
            firstname="Pips",
            lastname="Sprite",
            email="volunteer@example.com",
            role="volunteer",
        )
        viewer = User(
            firstname="Batty",
            lastname="Koda",
            email="viewer@example.com",
            role="viewer",
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
                location=from_shape(Point(2.380192, 48.878899), SRID),
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
                    ),
                    SRID
                ),
                status="pending",
                department_id=paris.id,
                user=volunteer,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=5),
                slope_percentage=8.3,
                location=from_shape(Point(2.386007, 48.880959), SRID),
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
                    ),
                    SRID
                ),
                status="validated",
                department_id=paris.id,
                user=admin,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=20),
                slope_percentage=12.7,
                location=from_shape(
                    Point(5.3698, 43.2965), SRID
                ),  # Coordonnées approximatives de Marseille
                boundary=from_shape(
                    Polygon(
                        [
                            (5.3708, 43.3005),
                            (5.3688, 43.2995),
                            (5.3678, 43.2975),
                            (5.3688, 43.2955),
                            (5.3708, 43.2945),
                            (5.3728, 43.2965),
                            (5.3708, 43.3005),
                        ]
                    ),
                    SRID
                ),
                status="pending",
                department_id=marseille.id,  # Assurez-vous que 'marseille' est défini dans votre code
                user=volunteer,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=15),
                slope_percentage=9.2,
                location=from_shape(Point(5.4008, 43.2865), SRID),  # Autour de Marseille
                boundary=from_shape(
                    Polygon(
                        [
                            (5.4018, 43.2905),
                            (5.3998, 43.2895),
                            (5.3988, 43.2875),
                            (5.3998, 43.2855),
                            (5.4018, 43.2845),
                            (5.4038, 43.2865),
                            (5.4018, 43.2905),
                        ]
                    ),
                    SRID
                ),
                status="validated",
                department_id=marseille.id,
                user=admin,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=10),
                slope_percentage=7.5,
                location=from_shape(Point(5.3508, 43.3165), SRID),  # Autour de Marseille
                boundary=from_shape(
                    Polygon(
                        [
                            (5.3518, 43.3205),
                            (5.3498, 43.3195),
                            (5.3488, 43.3175),
                            (5.3498, 43.3155),
                            (5.3518, 43.3145),
                            (5.3538, 43.3165),
                            (5.3518, 43.3205),
                        ]
                    ),
                    SRID
                ),
                status="pending",
                department_id=marseille.id,
                user=volunteer,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=5),
                slope_percentage=14.3,
                location=from_shape(Point(5.3808, 43.2765), SRID),  # Autour de Marseille
                boundary=from_shape(
                    Polygon(
                        [
                            (5.3818, 43.2805),
                            (5.3798, 43.2795),
                            (5.3788, 43.2775),
                            (5.3798, 43.2755),
                            (5.3818, 43.2745),
                            (5.3838, 43.2765),
                            (5.3818, 43.2805),
                        ]
                    ),
                    SRID
                ),
                status="validated",
                department_id=marseille.id,
                user=admin,
            ),
            ClearCut(
                cut_date=datetime.now() - timedelta(days=2),
                slope_percentage=10.8,
                location=from_shape(Point(5.3908, 43.2665),SRID),  # Autour de Marseille
                boundary=from_shape(
                    Polygon(
                        [
                            (5.3918, 43.2705),
                            (5.3898, 43.2695),
                            (5.3888, 43.2675),
                            (5.3898, 43.2655),
                            (5.3918, 43.2645),
                            (5.3938, 43.2665),
                            (5.3918, 43.2705),
                        ]
                    ),
                    SRID
                ),
                status="pending",
                department_id=marseille.id,
                user=volunteer,
            ),
        ]
        db.add_all(clear_cuts)

        db.commit()

        print(f"Added {len(users)} users to the database")
        print(f"Added {len(all_departments)} departments to the database")
        print(f"Added {len(clear_cuts)} clear cuts to the database")
        print("Database finished seeding!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
