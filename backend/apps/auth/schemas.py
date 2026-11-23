from pydantic import BaseModel, EmailStr


class LoginPayload(BaseModel):
    email: EmailStr


class RefreshPayload(BaseModel):
    refresh_token: str
