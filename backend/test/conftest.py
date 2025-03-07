import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

TEST_DATABASE_URL = "postgresql://devuser:devuser@db:5432/test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "TEST"
from alembic.config import Config  # noqa: E402
from alembic import command  # noqa: E402

# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app  # noqa: E402
from app.database import get_db  # noqa: E402


engine = create_engine(
    TEST_DATABASE_URL,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

alembic_cfg = Config("alembic.ini")


@pytest.fixture(scope="session")
def db():
    command.upgrade(alembic_cfg, "head")
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()
    command.downgrade(alembic_cfg, "base")


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
