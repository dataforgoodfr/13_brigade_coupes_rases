from sqlalchemy.pool import QueuePool

from app.config import settings
from app.database import engine


def test_engine_pool_follows_the_settings() -> None:
    pool = engine.pool
    assert isinstance(pool, QueuePool)
    assert pool.size() == settings.DB_POOL_SIZE
    assert pool._max_overflow == settings.DB_MAX_OVERFLOW
    assert pool._recycle == settings.DB_POOL_RECYCLE_SECONDS
    assert pool._pre_ping is True
