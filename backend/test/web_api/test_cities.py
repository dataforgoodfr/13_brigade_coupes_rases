from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import City, Department


def add_cities(db: Session, prefix: str, *names: str) -> None:
    # Les communes ne sont pas réinitialisées entre les tests (ni entre deux
    # exécutions) : chaque test nettoie et utilise ses propres codes INSEE.
    db.query(City).filter(City.zip_code.like(f"{prefix}%")).delete()
    department = Department(code=prefix, name="Test")
    db.add(department)
    db.add_all(
        City(zip_code=f"{prefix}{i:03d}", name=name, department=department)
        for i, name in enumerate(names)
    )
    db.commit()


def test_search_matches_case_insensitively_and_sorts_by_name(
    client: TestClient, db: Session
) -> None:
    add_cities(db, "98", "Qqville-sur-Loire", "Aqqville", "Bourg-Qqville")

    response = client.get("/api/v1/cities/search", params={"q": "QQVILLE"})

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [
        {"insee_code": "98001", "name": "Aqqville", "department_code": "98"},
        {"insee_code": "98002", "name": "Bourg-Qqville", "department_code": "98"},
        {"insee_code": "98000", "name": "Qqville-sur-Loire", "department_code": "98"},
    ]


def test_search_limits_the_results_to_15(client: TestClient, db: Session) -> None:
    add_cities(db, "99", *(f"Zzville {i:02d}" for i in range(20)))

    response = client.get("/api/v1/cities/search", params={"q": "zzville"})

    assert len(response.json()) == 15


def test_search_requires_at_least_two_characters(client: TestClient) -> None:
    assert client.get("/api/v1/cities/search", params={"q": "a"}).status_code == 422
    assert client.get("/api/v1/cities/search").status_code == 422
