import logging
import os

from pyairtable import Api
from sqlalchemy.orm import Session, joinedload

from app.models import City, ClearCutReport, User

logger = logging.getLogger(__name__)

AIRTABLE_TOKEN = os.getenv("AIRTABLE_TOKEN", "")
AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
USERS_TABLE = "Users"
REPORTS_TABLE = "ClearCutReports"
BATCH_SIZE = 10


def _to_fields(row: dict) -> dict:
    return {
        k: (v if isinstance(v, (bool, int, float)) else str(v))
        for k, v in row.items()
        if v is not None
    }


def _sync_table(table, rows: list[dict]) -> tuple[int, int, int]:
    existing = {
        int(rec["fields"]["id"]): rec["id"]
        for rec in table.all(fields=["id"])
        if "id" in rec["fields"]
    }
    pg_ids = {row["id"] for row in rows}
    to_create, to_update = [], []

    for row in rows:
        fields = _to_fields(row)
        if row["id"] in existing:
            to_update.append({"id": existing[row["id"]], "fields": fields})
        else:
            to_create.append(fields)

    to_delete = [aid for pg_id, aid in existing.items() if pg_id not in pg_ids]

    for i in range(0, len(to_create), BATCH_SIZE):
        table.batch_create(to_create[i : i + BATCH_SIZE])
    for i in range(0, len(to_update), BATCH_SIZE):
        table.batch_update(to_update[i : i + BATCH_SIZE])
    for i in range(0, len(to_delete), BATCH_SIZE):
        table.batch_delete(to_delete[i : i + BATCH_SIZE])

    return len(to_create), len(to_update), len(to_delete)


def _user_row(u: User) -> dict:
    return {
        "id": u.id,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "login": u.login,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "updated_at": u.updated_at.isoformat() if u.updated_at else None,
    }


def _report_row(r: ClearCutReport) -> dict:
    dept = r.city.department if r.city else None
    return {
        "id": r.id,
        "status": r.status,
        "slope_area_hectare": r.slope_area_hectare,
        "total_area_hectare": r.total_area_hectare,
        "total_ecological_zoning_area_hectare": r.total_ecological_zoning_area_hectare,
        "first_cut_date": r.first_cut_date.isoformat() if r.first_cut_date else None,
        "last_cut_date": r.last_cut_date.isoformat() if r.last_cut_date else None,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        "city": r.city.name if r.city else None,
        "department_code": dept.code if dept else None,
        "department_name": dept.name if dept else None,
        "assigned_to": r.user.login if r.user else None,
        "assignment_requested_by": r.assignment_requested_by.login if r.assignment_requested_by else None,
    }


def sync_data_with_airtable(db: Session) -> None:
    if not AIRTABLE_TOKEN or not AIRTABLE_BASE_ID:
        logger.warning("AIRTABLE_TOKEN or AIRTABLE_BASE_ID not set, skipping sync")
        return

    logger.info("Starting Airtable sync…")
    try:
        api = Api(AIRTABLE_TOKEN)

        users = db.query(User).filter(User.deleted_at.is_(None)).order_by(User.id).all()
        c, u, d = _sync_table(api.table(AIRTABLE_BASE_ID, USERS_TABLE), [_user_row(u) for u in users])
        logger.info("Users: created=%d updated=%d deleted=%d", c, u, d)

        reports = (
            db.query(ClearCutReport)
            .options(
                joinedload(ClearCutReport.city).joinedload(City.department),
                joinedload(ClearCutReport.user),
                joinedload(ClearCutReport.assignment_requested_by),
            )
            .order_by(ClearCutReport.id)
            .all()
        )
        c, u, d = _sync_table(api.table(AIRTABLE_BASE_ID, REPORTS_TABLE), [_report_row(r) for r in reports])
        logger.info("ClearCutReports: created=%d updated=%d deleted=%d", c, u, d)

        logger.info("Airtable sync complete")
    except Exception:
        logger.exception("Airtable sync failed")
