from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse


# ── Request Schemas ──────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None


class EventJoin(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=6)


# ── Response Schemas ─────────────────────────────────────────────────────────

class MemberResponse(BaseModel):
    id: int
    user_id: int
    username: str
    role: str
    selfies_uploaded: int
    joined_at: datetime

    model_config = {"from_attributes": True}


class EventResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    invite_code: str
    host_id: int
    status: str
    created_at: datetime
    member_count: int = 0
    photo_count: int = 0

    model_config = {"from_attributes": True}


class EventDetailResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    invite_code: str
    host: UserResponse
    status: str
    created_at: datetime
    members: list[MemberResponse] = []
    photo_count: int = 0

    model_config = {"from_attributes": True}
