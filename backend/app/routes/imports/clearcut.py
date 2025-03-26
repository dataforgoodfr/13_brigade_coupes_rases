from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from . import authenticate, router
from app.deps import get_db_session

from app.services.clearcut import (
    create_clearcut,
)
from app.schemas.clearcut import ClearCutCreate, ImportsClearCutResponse

db_dependency = get_db_session()


@router.post(
    "/clearcuts", response_model=ImportsClearCutResponse, dependencies=[Depends(authenticate)]
)
def post_clearcut(params: ClearCutCreate, db: Session = db_dependency):
    try:
        clearcut = create_clearcut(db, params)

        clearcut.department_code = clearcut.department.code

        return clearcut
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err)) from err
