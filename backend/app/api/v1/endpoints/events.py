from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.models import User
from app.schemas.event import EventCreate, EventDetailResponse, EventJoin, EventResponse
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new event. The creator becomes the host."""
    event = await event_service.create_event(data, current_user.id, db)
    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        invite_code=event.invite_code,
        host_id=event.host_id,
        status=event.status,
        created_at=event.created_at,
        member_count=1,
        photo_count=0,
    )


@router.get("", response_model=list[EventResponse])
async def list_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all events the current user is a member of."""
    events = await event_service.get_user_events(current_user.id, db)
    return [EventResponse(**e) for e in events]


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full details of an event (must be a member)."""
    detail = await event_service.get_event_detail(event_id, current_user.id, db)
    return EventDetailResponse(**detail)


@router.post("/join", response_model=EventResponse)
async def join_event(
    data: EventJoin,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join an event using an invite code."""
    event = await event_service.join_event(data.invite_code, current_user.id, db)
    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        invite_code=event.invite_code,
        host_id=event.host_id,
        status=event.status,
        created_at=event.created_at,
        member_count=0,  # will be recalculated on next fetch
        photo_count=0,
    )
