from typing import Optional
from fastapi import HTTPException
from pytest import Session

from app.models import City, ClearCut

from app.schemas.city import City as CitySchema
from app.services.departement import get_department_by_id


def get_city_by_name(db: Session, name: str) -> Optional[City]:
    return db.query(City).filter(City.name == name).first()


def get_or_add_city(db: Session, city: CitySchema) -> City:
    db_item = get_city_by_name(db, city.name)
    if db_item is not None:
        return City

    department = get_department_by_id(db, city.department_id)
    if department is None:
        raise HTTPException(
            status_code=404,
            detail=f"City {city.name} department not found by id {city.department_id}",
        )

    db_item = City(zip_code=city.zip_code, name=city.name, department=department)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
