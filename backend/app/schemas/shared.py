from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models import User

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
    role: Optional[str] = Field(
        default_factory=None,
        example="viewer")

    @field_validator('role')
    def validate_role(cls, value: str) -> str:
        if value is not None and value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value
    
    class Config:
        from_attributes = True