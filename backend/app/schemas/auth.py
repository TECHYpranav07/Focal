from pydantic import BaseModel, EmailStr, Field


# ── Request Schemas ──────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    username_or_email: str
    password: str


# ── Response Schemas ─────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
