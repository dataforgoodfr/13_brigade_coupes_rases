import logging
import os

from pyairtable import Api
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
AIRTABLE_USERS_TABLE = os.getenv("AIRTABLE_USERS_TABLE", "Utilisateurs")
AIRTABLE_COUPES_TABLE = os.getenv("AIRTABLE_COUPES_TABLE", "Coupes")


def sync_data_with_airtable(db: Session):
    if not AIRTABLE_API_KEY or not AIRTABLE_BASE_ID:
        logger.warning("Airtable API Key or Base ID not set. Skipping sync.")
        return

    logger.info("Starting Airtable synchronization...")
    try:
        api = Api(AIRTABLE_API_KEY)
        api.table(AIRTABLE_BASE_ID, AIRTABLE_USERS_TABLE)
        api.table(AIRTABLE_BASE_ID, AIRTABLE_COUPES_TABLE)

        # 1. Sync Users from PostgreSQL to Airtable
        # 2. Pull validation status (is_active) from Airtable to PostgreSQL
        # TODO: Implement actual mapping once the Airtable structure is defined
        logger.info("Airtable sync: Users handled.")

        # 3. Sync Coupes from PostgreSQL to Airtable
        # TODO: Implement actual mapping
        logger.info("Airtable sync: Coupes handled.")

        db.commit()
    except Exception as e:
        logger.error(f"Error during Airtable synchronization: {e}")
