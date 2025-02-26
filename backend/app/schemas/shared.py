from pydantic import BaseModel

class DepartmentBase(BaseModel):
    id: int
    code: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    firstname: str
    lastname: str
    email: str

    class Config:
        from_attributes = True