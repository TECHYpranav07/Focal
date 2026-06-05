import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import EventMember, Photo, Selfie

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


def _validate_image(file: UploadFile) -> None:
    """Validate that the uploaded file is an allowed image type."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )


def _generate_filename(original_filename: str) -> str:
    """Generate a UUID-based filename preserving the original extension."""
    ext = Path(original_filename).suffix if original_filename else ".jpg"
    return f"{uuid.uuid4().hex}{ext}"


async def save_photos(
    event_id: int,
    user_id: int,
    files: list[UploadFile],
    db: AsyncSession,
) -> list[Photo]:
    """Save uploaded group photos to disk and create Photo records."""
    photos_dir = settings.photos_dir
    photos_dir.mkdir(parents=True, exist_ok=True)

    saved_photos: list[Photo] = []

    for file in files:
        _validate_image(file)
        filename = _generate_filename(file.filename or "photo.jpg")
        file_path = photos_dir / filename

        # Write file to disk
        content = await file.read()
        file_path.write_bytes(content)

        photo = Photo(
            event_id=event_id,
            uploaded_by=user_id,
            filename=filename,
            file_path=str(file_path),
            processing_status="pending",
        )
        db.add(photo)
        saved_photos.append(photo)

    await db.flush()
    for photo in saved_photos:
        await db.refresh(photo)

    return saved_photos


async def get_event_photos(event_id: int, db: AsyncSession) -> list[Photo]:
    """Get all photos for an event."""
    result = await db.execute(
        select(Photo).where(Photo.event_id == event_id).order_by(Photo.created_at.desc())
    )
    return list(result.scalars().all())


async def save_selfies(
    event_id: int,
    user_id: int,
    files: list[UploadFile],
    db: AsyncSession,
) -> list[Selfie]:
    """Save uploaded selfies to disk, validate exactly one face is present, and store embeddings."""
    from app.services.face_service import extract_embeddings_from_image
    from app.utils.similarity import embedding_to_bytes

    selfies_dir = settings.selfies_dir
    selfies_dir.mkdir(parents=True, exist_ok=True)

    saved_selfies: list[Selfie] = []

    for file in files:
        _validate_image(file)
        filename = _generate_filename(file.filename or "selfie.jpg")
        file_path = selfies_dir / filename

        # Write file to disk
        content = await file.read()
        file_path.write_bytes(content)

        # Validate that exactly one face is present in the selfie
        faces = extract_embeddings_from_image(str(file_path))
        if len(faces) == 0:
            file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Selfie '{file.filename}' rejected: No face detected. Please upload a clear photo of your face."
            )
        elif len(faces) > 1:
            file_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Selfie '{file.filename}' rejected: {len(faces)} faces detected. Selfies must contain exactly one face (no group photos)."
            )

        emb_bytes = embedding_to_bytes(faces[0]["embedding"])

        selfie = Selfie(
            event_id=event_id,
            user_id=user_id,
            filename=filename,
            file_path=str(file_path),
            embedding=emb_bytes,
        )
        db.add(selfie)
        saved_selfies.append(selfie)

    await db.flush()
    for selfie in saved_selfies:
        await db.refresh(selfie)

    # Update member selfie count
    result = await db.execute(
        select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member:
        member.selfies_uploaded += len(saved_selfies)
        await db.flush()

    return saved_selfies


async def get_event_selfies(
    event_id: int, user_id: int, db: AsyncSession
) -> list[Selfie]:
    """Get all selfies for a user in an event."""
    result = await db.execute(
        select(Selfie).where(
            Selfie.event_id == event_id,
            Selfie.user_id == user_id,
        ).order_by(Selfie.created_at.desc())
    )
    return list(result.scalars().all())
