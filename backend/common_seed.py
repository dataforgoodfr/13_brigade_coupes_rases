import csv

from sqlalchemy.orm import Session

from app.models import City, Department, EcologicalZoning, Rules

# INSEE codes (column COM in cities_2024.csv) of the forest communes used by the
# dev seed. They are picked in real, heavily forested French departments so that
# clear cuts, Natura 2000 zones and department-based filters stay geographically
# consistent (unlike the previous Paris/Marseille fixtures).
SEED_CITY_CODES = {
    # Landes (40) — Forêt des Landes de Gascogne, pinède => résineux, faible pente
    "sabres": "40246",
    "labouheyre": "40134",
    "morcenx": "40197",
    # Lozère (48) — Mont Lozère, forêt mixte, forte pente
    "mende": "48095",
    "pont_de_montvert": "48116",
    # Creuse (23) — plateau de Millevaches, feuillus
    "aubusson": "23008",
    "royere": "23165",
    # Vosges (88) — massif vosgien, mixte/résineux, forte pente
    "gerardmer": "88196",
    "la_bresse": "88075",
}


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


def get_cities(db: Session) -> dict[str, City]:
    """Return the dev seed communes keyed by their short name (see SEED_CITY_CODES)."""
    cities = db.query(City).filter(City.zip_code.in_(SEED_CITY_CODES.values())).all()
    by_code = {city.zip_code: city for city in cities}
    return {
        name: by_code[code] for name, code in SEED_CITY_CODES.items() if code in by_code
    }


def seed_ecological_zonings(db: Session) -> dict[str, EcologicalZoning]:
    """Real Natura 2000 zones, one per forest region used by the dev seed."""
    zonings = {
        "landes": EcologicalZoning(
            type="Natura2000",
            sub_type="ZSC",
            code="FR7200721",
            name="Vallées de la Grande et de la Petite Leyre",
        ),
        "lozere": EcologicalZoning(
            type="Natura2000",
            sub_type="ZSC",
            code="FR9101368",
            name="Mont Lozère",
        ),
        "creuse": EcologicalZoning(
            type="Natura2000",
            sub_type="ZSC",
            code="FR7401131",
            name="Gorges de la Grande Creuse",
        ),
        "vosges": EcologicalZoning(
            type="Natura2000",
            sub_type="ZPS",
            code="FR4112003",
            name="Massif vosgien",
        ),
    }
    db.add_all(zonings.values())
    db.flush()
    return zonings


def seed_rules(db: Session, ecological_zonings: list[EcologicalZoning]) -> list[Rules]:
    rules = [
        Rules(
            type="area",
            threshold=10.0,
        ),
        Rules(
            type="slope",
            threshold=2.0,
        ),
        Rules(
            type="ecological_zoning",
            threshold=0.5,
            ecological_zonings=list(ecological_zonings),
        ),
    ]
    db.add_all(rules)
    db.flush()
    return rules
