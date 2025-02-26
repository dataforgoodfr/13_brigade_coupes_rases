import os
import sys

TEST_DATABASE_URL = "postgresql://devuser:devuser@db:5432/test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
import pytest  # noqa: E402
from app.database import Base  # noqa: E402

Base.registry.configure()
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)
