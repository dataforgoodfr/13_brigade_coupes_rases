import hashlib
import json
from collections.abc import Callable

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def request_fingerprint(*parts: object) -> str:
    """Identify a creation request by who sent it and what it contains.

    Some phones send the same request several times within a few milliseconds.
    Rows created by a request keep its fingerprint, under a unique constraint:
    the copies then return the row the first request created instead of adding
    another one. The client needs no key, so app versions already installed on
    phones are protected too.
    """
    payload = json.dumps(parts, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(payload.encode()).hexdigest()


def commit_once[T](db: Session, row: T, find_existing: Callable[[], T | None]) -> T:
    """Commit a new row carrying a fingerprint; when a concurrent copy of the
    request committed first, return that copy's row instead."""
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = find_existing()
        if existing is None:
            raise
        return existing
    db.refresh(row)
    return row
