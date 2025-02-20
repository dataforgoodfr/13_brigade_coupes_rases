from fastapi import APIRouter, Query
from sqlalchemy.orm import Session
from app.services.clearcut import create_clearcut, get_clearcut, update_clearcut
from app.deps import get_db_session
from logging import getLogger
from app.schemas.clearcut import ClearcutCreate, ClearcutResponse

logger = getLogger(__name__)
db_dependency = get_db_session()

router = APIRouter(prefix="/clearcut", tags=["Clearcut"])


@router.post("/", response_model=ClearcutResponse, status_code=201)
def post_clearcut(item: ClearcutCreate, db: Session = db_dependency) -> ClearcutResponse:
    logger.info(db)
    return create_clearcut(db, item)


@router.put("/", response_model=ClearcutResponse, status_code=201)
def put_clearcut(item: ClearcutCreate, db: Session = db_dependency) -> ClearcutResponse:
    logger.info(db)
    return update_clearcut(db, item)


@router.get("/{id}", response_model=list[ClearcutResponse])
def get_clearcuts_by_id(id: int, db: Session = db_dependency, skip: int = 0, limit: int = 10):
    logger.info(db)
    return get_clearcut(db, skip=skip, limit=limit)


@router.get("/previews/location",
            summary="Get map page data",
            description="Retrieve all clearcut locations within a specified area and the preview datas of some relevant ones.",
            response_model=list[ClearcutResponse])
def list_clearcuts_previews_location(
    geoBounds: str = Query(..., description="List of coordinates points"),
    surface: float = None,
    isInEcologicalZone: bool = None,
    isExcessiveSlope: bool = None,
    status: str = Query(None, description="toValidate | validated | rejected | waitingInformation"),
    db: Session = db_dependency,
    skip: int = 0,
    limit: int = 10):
    logger.info(db)
    return get_clearcut(db, skip=skip, limit=limit)

@router.get("/previews/",
            summary="Get list page data",
            description="Retrieve clearcut previews.",
            response_model=list[ClearcutResponse])
def list_clearcuts_previews(
    surface: float = None,
    isInEcologicalZone: bool = None,
    isExcessiveSlope: bool = None,
    status: str = Query(None, description="toValidate | validated | rejected | waitingInformation"),
    db: Session = db_dependency,
    skip: int = 0,
    limit: int = 10):
    logger.info(db)
    return get_clearcut(db, skip=skip, limit=limit)
