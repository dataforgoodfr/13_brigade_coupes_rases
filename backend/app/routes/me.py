from fastapi import APIRouter, Depends
from app.models import User
from app.schemas.user import UserResponseSchema
from app.services.user import map_user
from app.services.user_auth import get_current_user

router = APIRouter(prefix="/api/v1/me", tags=["Me"])


@router.get("/", response_model=UserResponseSchema, status_code=200)
def get_me(user: User = Depends(get_current_user)) -> UserResponseSchema:
    return map_user(user)
