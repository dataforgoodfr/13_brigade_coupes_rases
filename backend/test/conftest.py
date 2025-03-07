import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

# TEST_DATABASE_URL = "sqlite:///:memory:"
TEST_DATABASE_URL = "postgresql://devuser:devuser@db:5432/test"
# Set the SpatiaLite path
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "TEST"
from alembic.config import Config
from alembic import command

# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app  # noqa: E402
from app.database import get_db  # noqa: E402

engine = create_engine(
    TEST_DATABASE_URL,
    #                    connect_args={
    #     "check_same_thread": False,
    #     "timeout": 30,
    # },
)

# Load SpatiaLite extension
# @event.listens_for(engine, "connect")
# def load_spatialite(dbapi_conn, connection_record):
#     dbapi_conn.enable_load_extension(True)
#     dbapi_conn.load_extension("/usr/lib/x86_64-linux-gnu/mod_spatialite.so")
#     dbapi_conn.execute('SELECT InitSpatialMetaData(1);')


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

alembic_cfg = Config("alembic.ini")


@pytest.fixture(scope="session")
def db():
    # Base.metadata.create_all(bind=engine)
    command.upgrade(alembic_cfg, "head")
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()
    command.downgrade(alembic_cfg, "base")
    # Base.metadata.drop_all(bind=engine)


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
