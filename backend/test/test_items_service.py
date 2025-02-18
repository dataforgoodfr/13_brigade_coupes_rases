import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

TEST_DATABASE_URL = "sqlite:///./test.db"  # Use SQLite for testing
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_create_item(client):
    response = client.post("/items/", json={"name": "Test Item", "description": "A test item"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Item"
    assert data["description"] == "A test item"
    assert "id" in data


def test_get_items(client):
    response = client.get("/items/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
