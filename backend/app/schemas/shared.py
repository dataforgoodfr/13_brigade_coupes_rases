from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.models import User

class DepartmentBase(BaseModel):
    id: int
    code: int

    model_config = ConfigDict(from_attributes = True)

class UserBase(BaseModel):
    firstname: str = Field(
        default_factory=str,
        json_schema_extra={"example":"John"})
    lastname: str = Field(
        default_factory=str,
        json_schema_extra={"example":"Tree"})
    email: EmailStr = Field(
        default_factory=EmailStr,
        json_schema_extra={"example":"john.tree@canope.com"})
    role: Optional[str] = Field(
        default_factory=None,
        json_schema_extra={"example":"viewer"})

    @field_validator('role')
    def validate_role(cls, value: str) -> str:
        if value is not None and value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value
    
    model_config = ConfigDict(from_attributes = True)