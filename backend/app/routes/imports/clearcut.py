from fastapi import Depends
from sqlalchemy.orm import Session
from . import authenticate, router
from app.deps import get_db_session

from app.services.clearcut import (
    create_clearcut,
)

db_dependency = get_db_session()

from app.schemas.clearcut import ClearCutCreate, ImportsClearCutResponse


@router.post(
    "/clearcuts", response_model=ImportsClearCutResponse, dependencies=[Depends(authenticate)]
)
def post_clearcut(params: ClearCutCreate, db: Session = db_dependency):
    clearcut = create_clearcut(db, params)

    clearcut.department_code = clearcut.department.code
    clearcut.location = clearcut.location.coords[0]
    clearcut.boundary = [[list(polygon.exterior.coords)] for polygon in clearcut.boundary.geoms]

    return clearcut


@router.put("/clearcuts/{id}", dependencies=[Depends(authenticate)])
def update_clearcut(id: int):
    return {"id": id}
