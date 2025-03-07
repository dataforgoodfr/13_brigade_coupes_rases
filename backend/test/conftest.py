import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

TEST_DATABASE_URL = "postgresql://devuser:devuser@localhost:5432/test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "TEST"

# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app  # noqa: E402
from app.database import Base, get_db  # noqa: E402



engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db():
    with engine.begin() as connection: 
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))

    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()
    Base.metadata.drop_all(bind=engine)


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
