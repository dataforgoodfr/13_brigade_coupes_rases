from pydantic import BaseModel, EmailStr, Field

class DepartmentBase(BaseModel):
    id: int
    code: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    firstname: str = Field(
        default_factory=str,
        example="John")
    lastname: str = Field(
        default_factory=str,
        example="Tree")
    email: EmailStr = Field(
        default_factory=EmailStr,
        example="john.tree@canope.com")

    class Config:
        from_attributes = True