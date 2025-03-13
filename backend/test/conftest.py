import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add parent path to get access to app imports.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app  # noqa: E402
from app.database import  create_engine, get_db, sessionmaker  # noqa: E402
from alembic.config import Config  # noqa: E402
from alembic import command  # noqa: E402

TEST_DATABASE_URL = "postgresql://devuser:devuser@db:5432/test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL


alembic_cfg = Config("alembic.ini")

engine = create_engine(
    TEST_DATABASE_URL,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db():
    command.upgrade(alembic_cfg, "head")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()
    # command.downgrade(alembic_cfg, "base")


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
