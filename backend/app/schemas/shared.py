from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import User


class UserBaseSchema(BaseModel):
    firstname: str = Field(default_factory=str, json_schema_extra={"example": "John"})
    lastname: str = Field(default_factory=str, json_schema_extra={"example": "Tree"})
    login: str = Field(default_factory=str, json_schema_extra={"example": "JognTree78"})
    email: EmailStr = Field(
        default_factory=EmailStr, json_schema_extra={"example": "john.tree@canope.com"}
    )
    role: str = Field(default_factory=str, json_schema_extra={"example": "volunteer"})

    @field_validator("role")
    def validate_role(cls, value: str) -> str:
        if value is not None and value not in User.ROLES:
            raise ValueError(f"Role must be one of: {', '.join(User.ROLES)}")
        return value

    model_config = ConfigDict(from_attributes=True)
