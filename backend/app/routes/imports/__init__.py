from fastapi import APIRouter, Header, HTTPException

from app.config import settings

router = APIRouter(prefix="/imports", tags=["Import Clearcuts"])

def authenticate(x_imports_token: str = Header(default="")):
    if x_imports_token != settings.IMPORTS_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pull the child routes back into the parent
from . import clearcut
