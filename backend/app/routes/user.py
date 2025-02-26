from app.services.user import create_user, get_users
from fastapi import APIRouter
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse
from app.deps import get_db_session
from logging import getLogger

logger = getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])
db_dependency = get_db_session()


@router.post("/", response_model=UserResponse, status_code=201)
def create_new_user(item: UserCreate, db: Session = db_dependency) -> UserResponse:
    logger.info(db)
    return create_user(db, item)


# @router.patch("/{id}", response_model=ClearCutResponse, status_code=201)
# def update_existing_clearcut(id: int, item: ClearCutPatch, db: Session = db_dependency) -> ClearCutResponse:
#     logger.info(db)
#     return update_clearcut(id, db, item)


@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = db_dependency, skip: int = 0, limit: int = 10) -> list[UserResponse]:
    logger.info(db)
    return get_users(db, skip=skip, limit=limit)
