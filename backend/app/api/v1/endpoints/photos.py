from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.models import User
from app.schemas.photo import PhotoResponse, PhotoUploadResponse
from app.services import event_service, photo_service

router = APIRouter(prefix="/events", tags=["Photos"])


@router.post("/{event_id}/photos", response_model=PhotoUploadResponse, status_code=201)
async def upload_photos(
    event_id: int,
    files: list[UploadFile],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more group photos to an event."""
    await event_service.verify_membership(event_id, current_user.id, db)
    photos = await photo_service.save_photos(event_id, current_user.id, files, db)
    return PhotoUploadResponse(
        message=f"{len(photos)} photo(s) uploaded successfully",
        photos=[PhotoResponse.model_validate(p) for p in photos],
    )


@router.get("/{event_id}/photos", response_model=list[PhotoResponse])
async def list_photos(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all photos in an event."""
    await event_service.verify_membership(event_id, current_user.id, db)
    photos = await photo_service.get_event_photos(event_id, db)
    return [PhotoResponse.model_validate(p) for p in photos]
