from pydantic import BaseModel, EmailStr


class RegisterSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    login: str
    password: str


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str
