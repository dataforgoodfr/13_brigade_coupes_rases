from fastapi import Depends
from app.database import get_db


def get_db_session():
    return Depends(get_db)
