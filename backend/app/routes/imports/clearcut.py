from fastapi import Depends
from . import authenticate, router


@router.post("/clearcuts", dependencies=[Depends(authenticate)])
def create_clearcut():
    return {"id": 1}


@router.put("/clearcut/{id}", dependencies=[Depends(authenticate)])
def update_clearcut(id: int):
    return {"id": id}
