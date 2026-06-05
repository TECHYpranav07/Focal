import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import async_session_factory
from app.db.session import get_db
from app.models.models import User
from app.schemas.photo import ProcessingStatusResponse
from app.services import event_service, face_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["Face Processing"])


async def _run_matching(event_id: int) -> None:
    """Background task that runs the full face matching pipeline."""
    async with async_session_factory() as db:
        try:
            result = await face_service.match_faces_for_event(event_id, db)
            logger.info("Face matching complete for event %s: %s", event_id, result)
        except Exception as exc:
            logger.error("Face matching failed for event %s: %s", event_id, exc)
            raise


@router.post("/{event_id}/process", status_code=202)
async def trigger_processing(
    event_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger face detection and matching for all photos in the event.

    Processing runs in the background. Poll the status endpoint for progress.
    """
    member = await event_service.verify_membership(event_id, current_user.id, db)

    # Only the host can trigger processing
    if member.role != "host":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the event host can trigger processing",
        )

    background_tasks.add_task(_run_matching, event_id)

    return {
        "message": "Face processing started",
        "event_id": event_id,
    }


@router.get("/{event_id}/process/status", response_model=ProcessingStatusResponse)
async def get_processing_status(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current processing status of an event."""
    await event_service.verify_membership(event_id, current_user.id, db)
    status_data = await face_service.get_processing_status(event_id, db)
    return ProcessingStatusResponse(**status_data)
