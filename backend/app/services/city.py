from fastapi import status
from sqlalchemy.orm import Session

from app.common.errors import AppHTTPException
from app.models import City


def get_city_by_name(db: Session, name: str) -> City | None:
    return db.query(City).filter(City.name == name).first()


def get_city_by_zip_code(db: Session, zip_code: str) -> City:
    city = db.query(City).filter(City.zip_code == zip_code).first()
    if city is None:
        raise AppHTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            type="CITY_NOT_FOUND",
            detail=f"City not found by zip code {zip_code}",
        )
    return city
