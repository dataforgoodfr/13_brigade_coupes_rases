import csv

from app.database import SessionLocal
from app.models import City, Department


def clean_cities():
    db = SessionLocal()

    # if db.query(Department).first() is not None and db.query(City).first() is not None:
    #     return db.query(Department).all()
    with open("data/cities_2024.csv") as cities_file:
        cities_reader = csv.DictReader(cities_file)
        db_departments = db.query(Department).all()
        for city in cities_reader:
            db_city = db.query(City).filter(City.zip_code == city["COM"]).first()
            if db_city is not None:
                for db_department in db_departments:
                    if db_department.code == city["DEP"]:
                        db_city.department = db_department
        db.commit()


if __name__ == "__main__":
    clean_cities()
