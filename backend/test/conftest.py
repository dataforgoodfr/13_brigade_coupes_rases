import os

os.environ["ENVIRONMENT"] = "test"

import pathlib
import sys
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Add parent path to get access to app imports.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402

import app.models as models  # noqa: F401 Import must exist to load models for db truncate
from app.config import settings
from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from seed_dev import seed_database

os.environ["DATABASE_URL"] = settings.DATABASE_URL

alembic_cfg = Config("alembic.ini")

engine = create_engine(
    settings.DATABASE_URL,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


UNIT_TESTS_DIR = pathlib.Path(__file__).parent / "unit"


def pytest_collection_modifyitems(
    session: pytest.Session, config: pytest.Config, items: list[pytest.Item]
) -> None:
    # Niveau de test d'après le dossier : test/unit/ ne touche pas la base,
    # tout le reste passe par la fixture `db` (base migrée et peuplée).
    for item in items:
        if UNIT_TESTS_DIR in item.path.parents:
            item.add_marker(pytest.mark.unit)
        else:
            item.add_marker(pytest.mark.integration)

    focused_items = [item for item in items if item.get_closest_marker("focus")]

    # If there are focused tests, skip all others
    if focused_items:
        for item in items:
            if item not in focused_items:
                item.add_marker(pytest.mark.skip(reason="focusing on other tests"))


@pytest.fixture(scope="session")
def migration() -> None:
    print("Running migrations")
    command.upgrade(alembic_cfg, "head")


@pytest.fixture(scope="function")
def db(request: pytest.FixtureRequest) -> Iterator[Session]:
    if request.node.get_closest_marker("unit"):
        pytest.fail("Un test de test/unit/ ne doit pas utiliser la base de données")
    db = SessionLocal()
    seed_database()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture(scope="function")
def client(db: Session) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def imports_client(db: Session) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app, headers={"x-imports-token": "test-token"})
    yield client
    app.dependency_overrides.clear()
