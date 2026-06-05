from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.models import User
from app.schemas.photo import SelfieResponse, SelfieUploadResponse
from app.services import event_service, photo_service

router = APIRouter(prefix="/events", tags=["Selfies"])


@router.post("/{event_id}/selfies", response_model=SelfieUploadResponse, status_code=201)
async def upload_selfies(
    event_id: int,
    files: list[UploadFile],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more selfies for face matching."""
    await event_service.verify_membership(event_id, current_user.id, db)
    selfies = await photo_service.save_selfies(event_id, current_user.id, files, db)
    return SelfieUploadResponse(
        message=f"{len(selfies)} selfie(s) uploaded successfully",
        selfies=[
            SelfieResponse(
                id=s.id,
                event_id=s.event_id,
                user_id=s.user_id,
                filename=s.filename,
                file_path=s.file_path,
                has_embedding=s.embedding is not None,
                created_at=s.created_at,
            )
            for s in selfies
        ],
    )


@router.get("/{event_id}/selfies", response_model=list[SelfieResponse])
async def list_selfies(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all selfies for the current user in an event."""
    await event_service.verify_membership(event_id, current_user.id, db)
    selfies = await photo_service.get_event_selfies(event_id, current_user.id, db)
    return [
        SelfieResponse(
            id=s.id,
            event_id=s.event_id,
            user_id=s.user_id,
            filename=s.filename,
            file_path=s.file_path,
            has_embedding=s.embedding is not None,
            created_at=s.created_at,
        )
        for s in selfies
    ]
