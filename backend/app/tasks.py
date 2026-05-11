import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.database import SessionLocal
from app.services.airtable_sync import sync_data_with_airtable

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def scheduled_airtable_sync():
    logger.info("Executing scheduled Airtable sync job...")
    db = SessionLocal()
    try:
        sync_data_with_airtable(db)
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        # Schedule at 8:00 and 12:00 every day
        scheduler.add_job(
            scheduled_airtable_sync,
            trigger=CronTrigger(hour="8,14", minute="0", timezone="Europe/Paris"),
            id="airtable_sync_job",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Background scheduler started. Airtable sync scheduled for 8:00 and 14:00 (Europe/Paris).")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler stopped.")
