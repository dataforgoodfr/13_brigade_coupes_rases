import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text


# Add parent path to get access to app imports.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.models as models  # noqa: F401 Import must exist to load models for db truncate
from app.main import app  # noqa: E402
from app.database import create_engine, Base, get_db, sessionmaker  # noqa: E402
from alembic.config import Config  # noqa: E402
from alembic import command  # noqa: E402
from app.config import settings

os.environ["DATABASE_URL"] = settings.DATABASE_URL

alembic_cfg = Config("alembic.ini")

engine = create_engine(
    settings.DATABASE_URL,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Settings tables are not truncated as their data is generated in a migration.
SETTINGS_TABLES = ["departments"]


def pytest_collection_modifyitems(session, config, items):
    focused_items = [item for item in items if item.get_closest_marker("focus")]

    # If there are focused tests, skip all others
    if focused_items:
        for item in items:
            if item not in focused_items:
                item.add_marker(pytest.mark.skip(reason="focusing on other tests"))


@pytest.fixture(scope="session")
def migration():
    print("Running migrations")
    command.upgrade(alembic_cfg, "head")


@pytest.fixture(scope="function")
def db(migration, nuke_all_tables):
    db = SessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


@pytest.fixture(scope="function")
def nuke_all_tables():
    db = SessionLocal()
    try:
        metadata = Base.metadata
        tables = ", ".join(
            table.name for table in metadata.sorted_tables if table.name not in SETTINGS_TABLES
        )
        db.execute(text(f"TRUNCATE TABLE {tables} CASCADE"))
        db.commit()
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(nuke_all_tables, db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
