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


def search_names(client: TestClient, q: str) -> list[str]:
    """The names found among the test cities, whose code starts with 98."""
    response = client.get("/api/v1/cities/search", params={"q": q})
    assert response.status_code == status.HTTP_200_OK
    return [
        city["name"] for city in response.json() if city["insee_code"].startswith("98")
    ]


def test_search_puts_the_best_matches_first(client: TestClient, db: Session) -> None:
    add_cities(db, "98", "Aqqville", "Bourg-Qqville", "Qqville-sur-Loire", "Qqville")

    assert search_names(client, "QQVILLE") == [
        "Qqville",
        "Qqville-sur-Loire",
        "Bourg-Qqville",
        "Aqqville",
    ]


def test_search_ignores_accents(client: TestClient, db: Session) -> None:
    add_cities(db, "98", "Qqcivières", "Vendœuvres-Qq")

    assert search_names(client, "qqcivieres") == ["Qqcivières"]
    assert search_names(client, "QQCIVIÈRES") == ["Qqcivières"]
    assert search_names(client, "vendoeuvres qq") == ["Vendœuvres-Qq"]


def test_search_tolerates_light_typos(client: TestClient, db: Session) -> None:
    add_cities(db, "98", "Zalcivières")

    assert search_names(client, "zalicvieres") == ["Zalcivières"]
    assert search_names(client, "zalvieres") == ["Zalcivières"]


def test_search_spells_out_saint(client: TestClient, db: Session) -> None:
    add_cities(db, "98", "Saint-Qqdidier", "Sainte-Qqfoy")

    assert search_names(client, "st qqdidier") == ["Saint-Qqdidier"]
    assert search_names(client, "ste qqfoy") == ["Sainte-Qqfoy"]


def test_search_ignores_like_wildcards(client: TestClient, db: Session) -> None:
    add_cities(db, "98", "Qqville")

    assert search_names(client, "q%e") == []


def test_search_limits_the_results_to_15(client: TestClient, db: Session) -> None:
    add_cities(db, "99", *(f"Zzville {i:02d}" for i in range(20)))

    response = client.get("/api/v1/cities/search", params={"q": "zzville"})

    assert len(response.json()) == 15


def test_search_requires_at_least_two_characters(client: TestClient) -> None:
    assert client.get("/api/v1/cities/search", params={"q": "a"}).status_code == 422
    assert client.get("/api/v1/cities/search").status_code == 422
