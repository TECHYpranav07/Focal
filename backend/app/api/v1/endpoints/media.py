import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.models import EventMember, Photo, Selfie, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["Media"])


@router.get("/photos/{filename}", response_class=FileResponse)
async def serve_photo(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Serve an uploaded event photo, only if the user is a member of the event."""
    # Find the photo in the database
    result = await db.execute(select(Photo).where(Photo.filename == filename))
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    # Verify user is a member of the event
    member_result = await db.execute(
        select(EventMember).where(
            EventMember.event_id == photo.event_id,
            EventMember.user_id == current_user.id,
        )
    )
    if member_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this photo",
        )

    # Resolve safe path
    file_path = Path(photo.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    return FileResponse(str(file_path))


@router.get("/selfies/{filename}", response_class=FileResponse)
async def serve_selfie(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Serve a user's selfie, only if the user owns the selfie or is the event host."""
    # Find the selfie in the database
    result = await db.execute(select(Selfie).where(Selfie.filename == filename))
    selfie = result.scalar_one_or_none()
    if selfie is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selfie not found",
        )

    # Verify ownership or host status
    is_authorized = selfie.user_id == current_user.id
    if not is_authorized:
        # Check if the current user is a host of the event
        member_result = await db.execute(
            select(EventMember).where(
                EventMember.event_id == selfie.event_id,
                EventMember.user_id == current_user.id,
                EventMember.role == "host",
            )
        )
        if member_result.scalar_one_or_none() is not None:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this selfie",
        )

    # Resolve safe path
    file_path = Path(selfie.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    return FileResponse(str(file_path))
