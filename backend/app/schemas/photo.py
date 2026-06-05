from datetime import datetime

from pydantic import BaseModel


class FaceMatchDetail(BaseModel):
    id: int
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    matched_user_id: int | None = None
    matched_username: str | None = None
    similarity_score: float | None = None

    model_config = {"from_attributes": True}


class PhotoResponse(BaseModel):
    id: int
    event_id: int
    uploaded_by: int
    filename: str
    file_path: str
    processing_status: str
    face_count: int
    created_at: datetime
    faces: list[FaceMatchDetail] = []

    model_config = {"from_attributes": True}


class PhotoUploadResponse(BaseModel):
    message: str
    photos: list[PhotoResponse]


class SelfieResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    filename: str
    file_path: str
    has_embedding: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class SelfieUploadResponse(BaseModel):
    message: str
    selfies: list[SelfieResponse]


class ProcessingStatusResponse(BaseModel):
    event_id: int
    status: str
    total_photos: int
    processed_photos: int
    total_faces_detected: int
    total_matches: int


class FaceEmbeddingResponse(BaseModel):
    id: int
    photo_id: int
    bbox_x: int
    bbox_y: int
    bbox_w: int
    bbox_h: int
    detection_confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}
