import os
import sys
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
import pytest  # noqa: E402
from app.database import Base  # noqa: E402
from alembic.config import Config
from alembic import command

TEST_DATABASE_URL = "postgresql://devuser:devuser@localhost:5432/test"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
# Add parent path to get access to app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

alembic_cfg = Config("alembic.ini")

@pytest.fixture(scope="function")
def db():

    command.upgrade(alembic_cfg, "head")
    db = TestingSessionLocal()
    yield db
    db.close()
    command.downgrade(alembic_cfg, "base")

