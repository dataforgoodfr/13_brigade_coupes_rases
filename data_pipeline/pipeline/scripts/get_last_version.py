import os
import logging
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def get_last_version() -> str | None:
    load_dotenv()
    logging.info("Getting last version date from database...")
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url, plugins=["geoalchemy2"])
    with engine.connect() as conn:
        result = conn.execute(text("SELECT MAX(observation_end_date) FROM clear_cuts"))
        max_date = result.scalar()

    if max_date is None:
        logging.info("No data in database, this is the first run.")
        return None

    logging.info(f"Last version date_max from database: {max_date}")
    return max_date
