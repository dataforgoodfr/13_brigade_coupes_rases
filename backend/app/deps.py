from fastapi import Depends
from app.database import get_db


db_session = Depends(get_db)
