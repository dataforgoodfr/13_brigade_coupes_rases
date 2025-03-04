import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
import pytest  # noqa: E402

from app.database import Base
from app.main import app

TEST_DATABASE_URL = "postgresql://devuser:devuser@localhost:5432/test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)  # Create tables
    yield  # Execute tests
    Base.metadata.drop_all(bind=engine)  # Delete tables

@pytest.fixture(scope="function")
def db():
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def test_client():
    from app.database import get_db
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    yield client

