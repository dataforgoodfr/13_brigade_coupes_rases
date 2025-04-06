import csv
from sqlalchemy.orm import Session

from app.models import City, Department, EcologicalZoning


def seed_cities_departments(db: Session):
    if db.query(Department).first() is not None and db.query(City).first() is not None:
        return db.query(Department).all()
    with open("data/departments_2024.csv") as department_file:
        with open("data/cities_2024.csv") as cities_file:
            departments_reader = csv.DictReader(department_file)
            cities_reader = csv.DictReader(cities_file)
            departments_reader.__next__()
            cities_reader.__next__()
            departments = [
                Department(
                    code=department["DEP"],
                    name=department["LIBELLE"],
                    cities=[
                        City(zip_code=city["COM"], name=city["LIBELLE"])
                        for city in cities_reader
                    ],
                )
                for department in departments_reader
            ]

            db.add_all(departments)
            db.flush()
            return departments


def get_cities(db: Session) -> list[City]:
    marseille = db.query(City).filter(City.zip_code == "13055").first()
    paris = db.query(City).filter(City.zip_code == "75056").first()

    return [marseille, paris]


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
