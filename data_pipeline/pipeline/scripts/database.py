from sqlalchemy import Engine, create_engine


def sqlalchemy_url(database_url: str) -> str:
    """Hosting providers hand out plain postgresql:// (or postgres://) URLs,
    which SQLAlchemy 2.0 maps to psycopg2: point them at psycopg 3."""
    for scheme in ("postgresql://", "postgres://"):
        if database_url.startswith(scheme):
            return "postgresql+psycopg://" + database_url.removeprefix(scheme)
    return database_url


def create_db_engine(database_url: str) -> Engine:
    return create_engine(sqlalchemy_url(database_url), plugins=["geoalchemy2"])
