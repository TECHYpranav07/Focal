from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.models import Event, Match, Photo, User
from app.schemas.gallery import GalleryPhotoResponse, GalleryResponse
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Gallery"])


@router.get("/{event_id}/gallery", response_model=GalleryResponse)
async def get_gallery(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the personal gallery of matched photos for the current user in an event."""
    await event_service.verify_membership(event_id, current_user.id, db)

    # Get event info
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one()

    # Get all matches for this user in this event
    matches_result = await db.execute(
        select(Match)
        .where(Match.event_id == event_id, Match.user_id == current_user.id)
        .order_by(Match.similarity_score.desc())
    )
    matches = matches_result.scalars().all()

    # Deduplicate by photo_id, keeping the best similarity score
    best_by_photo: dict[int, Match] = {}
    for match in matches:
        if match.photo_id not in best_by_photo:
            best_by_photo[match.photo_id] = match
        elif match.similarity_score > best_by_photo[match.photo_id].similarity_score:
            best_by_photo[match.photo_id] = match

    # Build gallery items
    gallery_photos: list[GalleryPhotoResponse] = []
    for photo_id, best_match in best_by_photo.items():
        photo_result = await db.execute(select(Photo).where(Photo.id == photo_id))
        photo = photo_result.scalar_one_or_none()
        if photo is None:
            continue
        gallery_photos.append(
            GalleryPhotoResponse(
                photo_id=photo.id,
                filename=photo.filename,
                file_path=photo.file_path,
                event_id=photo.event_id,
                best_similarity_score=best_match.similarity_score,
                matched_at=best_match.created_at,
                faces=photo.faces,
            )
        )

    # Sort by similarity score descending
    gallery_photos.sort(key=lambda p: p.best_similarity_score, reverse=True)

    return GalleryResponse(
        event_id=event_id,
        event_name=event.name,
        user_id=current_user.id,
        total_matches=len(gallery_photos),
        photos=gallery_photos,
    )


@router.get("/{event_id}/gallery/download")
async def download_gallery_zip(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download all matched photos for the current user in a single ZIP file."""
    import io
    import zipfile
    from pathlib import Path
    from fastapi import HTTPException
    from fastapi.responses import StreamingResponse

    await event_service.verify_membership(event_id, current_user.id, db)

    # Get all matches for this user in this event
    matches_result = await db.execute(
        select(Match)
        .where(Match.event_id == event_id, Match.user_id == current_user.id)
    )
    matches = matches_result.scalars().all()

    photo_ids = list(set([m.photo_id for m in matches]))
    if not photo_ids:
        raise HTTPException(status_code=400, detail="No matched photos found to download")

    photos_result = await db.execute(
        select(Photo).where(Photo.id.in_(photo_ids))
    )
    photos = photos_result.scalars().all()

    # Create ZIP in memory
    zip_io = io.BytesIO()
    with zipfile.ZipFile(zip_io, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for photo in photos:
            file_path = Path(photo.file_path)
            if file_path.exists():
                zip_file.write(file_path, arcname=photo.filename)

    zip_io.seek(0)
    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=focal_gallery_{event_id}.zip"
        }
    )
