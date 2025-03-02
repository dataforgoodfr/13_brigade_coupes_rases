import os
import sys

TEST_DATABASE_URL = "sqlite:///:memory:"
# Set the SpatiaLite path
os.environ["SPATIALITE_LIBRARY_PATH"] = "/usr/lib/x86_64-linux-gnu/mod_spatialite.so"

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "TEST"
# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
import pytest  # noqa: E402
from app.database import Base  # noqa: E402
from app.main import app 

engine = create_engine(TEST_DATABASE_URL,connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
)

# Load SpatiaLite extension
@event.listens_for(engine, "connect")
def load_spatialite(dbapi_conn, connection_record):
    dbapi_conn.enable_load_extension(True)
    dbapi_conn.load_extension("/usr/lib/x86_64-linux-gnu/mod_spatialite.so")
    dbapi_conn.execute('SELECT InitSpatialMetaData(1);')


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    db = TestingSessionLocal()
    Base.metadata.create_all(bind=engine)
    yield db