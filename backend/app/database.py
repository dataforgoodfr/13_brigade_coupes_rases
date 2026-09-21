import logging
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

logging.basicConfig()
# Statement logging carries bound parameters (e-mails, password hashes): opt-in only
logging.getLogger("sqlalchemy.engine").setLevel(
    logging.INFO if settings.SQL_ECHO else logging.WARNING
)

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    plugins=["geoalchemy2"],
    # Connections dropped by the server (idle timeout, restart) are detected
    # before use instead of failing the first request after them
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE_SECONDS,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Dependency for FastAPI routes
def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
