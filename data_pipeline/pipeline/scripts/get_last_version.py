import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Engine, text

from pipeline.scripts.database import create_db_engine

# Seules les dates posées par la pipeline disent jusqu'où les alertes RADD ont
# été chargées. Une coupe tracée par un bénévole reçoit l'heure de sa création
# (jamais minuit), et une coupe corrigée à la main garde les dates saisies :
# les compter ferait sauter les alertes plus anciennes au passage suivant.
LAST_DETECTION_QUERY = """
    SELECT MAX(observation_end_date) FROM clear_cuts
    WHERE observation_end_date = date_trunc('day', observation_end_date)
      AND NOT is_manually_edited
"""


def last_detection_date(engine: Engine) -> datetime | None:
    with engine.connect() as conn:
        return conn.execute(text(LAST_DETECTION_QUERY)).scalar()


def get_last_version() -> datetime | None:
    load_dotenv()
    logging.info("Getting last version date from database...")
    database_url = os.environ["DATABASE_URL"]
    max_date = last_detection_date(create_db_engine(database_url))

    if max_date is None:
        logging.info("No data in database, this is the first run.")
        return None

    logging.info(f"Last version date_max from database: {max_date}")
    return max_date
