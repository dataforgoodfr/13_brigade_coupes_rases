from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.deps import db_session

router = APIRouter(prefix="/api/v1/cities", tags=["Cities"])

# Below the default 0.6, which misses "valicvieres" for "Valcivières"
WORD_SIMILARITY_THRESHOLD = 0.5

# Names are compared by city_search_key (no accents, "st" for "saint"…).
# Exact names come first, then names starting with the search, names with a
# word starting with it, names containing it, and last the close spellings.
SEARCH_CITIES = text(
    """
    WITH search AS (SELECT city_search_key(CAST(:q AS text)) AS key),
    matches AS (
        SELECT c.zip_code, c.name, d.code AS department_code,
            city_search_key(c.name) AS name_key,
            left(c.zip_code, length(d.code)) = d.code AS in_its_department
        FROM cities c
        JOIN departments d ON d.id = c.department_id, search
        WHERE city_search_key(c.name) LIKE '%' || search.key || '%'
            OR search.key <% city_search_key(c.name)
    ),
    -- Some cities are stored twice, once in a wrong department
    unique_matches AS (
        SELECT DISTINCT ON (zip_code, name) *
        FROM matches
        ORDER BY zip_code, name, in_its_department DESC
    )
    SELECT zip_code, name,
        CASE WHEN in_its_department THEN department_code
            ELSE left(zip_code, CASE WHEN zip_code LIKE '97%' THEN 3 ELSE 2 END)
        END AS department_code
    FROM unique_matches, search
    ORDER BY
        CASE
            WHEN name_key = search.key THEN 0
            WHEN name_key LIKE search.key || '%' THEN 1
            WHEN ' ' || name_key LIKE '% ' || search.key || '%' THEN 2
            WHEN name_key LIKE '%' || search.key || '%' THEN 3
            ELSE 4
        END,
        similarity(search.key, name_key) DESC,
        length(name),
        name
    LIMIT 15
    """
)


class CitySearchResult(BaseModel):
    insee_code: str
    name: str
    department_code: str


@router.get("/search", response_model=list[CitySearchResult])
def search_cities(
    q: str = Query(..., min_length=2),
    db: Session = db_session,
) -> list[CitySearchResult]:
    db.execute(
        text(
            f"SET LOCAL pg_trgm.word_similarity_threshold = {WORD_SIMILARITY_THRESHOLD}"
        )
    )
    # A LIKE wildcard typed in the search would match any name
    query = q.replace("%", " ").replace("_", " ")
    return [
        CitySearchResult(
            insee_code=row.zip_code,
            name=row.name,
            department_code=row.department_code,
        )
        for row in db.execute(SEARCH_CITIES, {"q": query})
    ]
