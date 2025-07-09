import csv

from sqlalchemy.orm import Session

from app.models import City, Department, EcologicalZoning, Rules


def seed_cities_departments(db: Session):
    if db.query(Department).first() is not None and db.query(City).first() is not None:
        return db.query(Department).all()
    with open("data/departments_2024.csv") as department_file:
        with open("data/cities_2024.csv") as cities_file:
            departments_reader = csv.DictReader(department_file)
            cities_reader = csv.DictReader(cities_file)
            departments = {
                department_row["DEP"]: Department(
                    code=department_row["DEP"],
                    name=department_row["LIBELLE"],
                    cities=[],
                )
                for department_row in departments_reader
            }

            for city_row in cities_reader:
                department = departments.get(city_row["DEP"])
                if department is not None:
                    department.cities.append(
                        City(zip_code=city_row["COM"], name=city_row["LIBELLE"])
                    )

            db.add_all(departments.values())
            db.flush()
            return departments


def get_cities(db: Session) -> list[City]:
    marseille = db.query(City).filter(City.zip_code == "13055").first()
    paris = db.query(City).filter(City.zip_code == "75056").first()
    return [city for city in [marseille, paris] if city is not None]


def seed_ecological_zonings(db: Session) -> tuple[EcologicalZoning, EcologicalZoning]:
    ecological_zonings = [
        EcologicalZoning(
            type="Natura2000",
            sub_type="ZSC",
            code="FR1100796",
            name="Forêt de Rambouillet",
        ),
        EcologicalZoning(
            type="Natura2000", code="FR5300050", name="Etands de canal d'Ille et Rance"
        ),
    ]
    db.add_all(ecological_zonings)
    db.flush()
    return (ecological_zonings[0], ecological_zonings[1])


def seed_rules(db: Session, ecological_zonings: list[EcologicalZoning]):
    rules = [
        Rules(
            type="area",
            threshold=10.0,
        ),
        Rules(
            type="slope",
            threshold=30.0,
        ),
        Rules(
            type="ecological_zoning",
            threshold=0.5,
            ecological_zonings=ecological_zonings,
        ),
    ]
    db.add_all(rules)
    db.flush()
    return (ecological_zonings[0], ecological_zonings[1])
