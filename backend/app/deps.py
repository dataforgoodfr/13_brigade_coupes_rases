from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db


def get_db_session():
    return Depends(get_db)
