from datetime import datetime

from pydantic import BaseModel

from app.schemas.photo import FaceMatchDetail


class MatchResponse(BaseModel):
    id: int
    photo_id: int
    similarity_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class GalleryPhotoResponse(BaseModel):
    photo_id: int
    filename: str
    file_path: str
    event_id: int
    best_similarity_score: float
    matched_at: datetime
    faces: list[FaceMatchDetail] = []

    model_config = {"from_attributes": True}


class GalleryResponse(BaseModel):
    event_id: int
    event_name: str
    user_id: int
    total_matches: int
    photos: list[GalleryPhotoResponse]
