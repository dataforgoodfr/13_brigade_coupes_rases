from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.deps import db_session
from app.models import City

router = APIRouter(prefix="/api/v1/cities", tags=["Cities"])


class CitySearchResult(BaseModel):
    insee_code: str
    name: str
    department_code: str


@router.get("/search", response_model=list[CitySearchResult])
def search_cities(
    q: str = Query(..., min_length=2),
    db: Session = db_session,
) -> list[CitySearchResult]:
    cities = (
        db.query(City)
        .filter(City.name.ilike(f"%{q}%"))
        .order_by(City.name)
        .limit(15)
        .all()
    )
    return [
        CitySearchResult(
            insee_code=city.zip_code,
            name=city.name,
            department_code=city.department.code if city.department else "",
        )
        for city in cities
    ]
