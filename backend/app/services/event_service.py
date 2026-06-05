from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Event, EventMember, Photo, generate_invite_code
from app.schemas.event import EventCreate


async def create_event(data: EventCreate, host_id: int, db: AsyncSession) -> Event:
    """Create a new event and add the host as a member with role='host'."""
    # Generate a unique invite code
    for _ in range(10):  # retry up to 10 times for uniqueness
        code = generate_invite_code()
        existing = await db.execute(select(Event).where(Event.invite_code == code))
        if existing.scalar_one_or_none() is None:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate unique invite code",
        )

    event = Event(
        name=data.name,
        description=data.description,
        invite_code=code,
        host_id=host_id,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)

    # Add host as a member
    member = EventMember(
        event_id=event.id,
        user_id=host_id,
        role="host",
    )
    db.add(member)
    await db.flush()

    return event


async def get_user_events(user_id: int, db: AsyncSession) -> list[dict]:
    """Return all events the user is a member of, with counts."""
    result = await db.execute(
        select(EventMember.event_id).where(EventMember.user_id == user_id)
    )
    event_ids = [row[0] for row in result.all()]

    if not event_ids:
        return []

    events_out = []
    for event_id in event_ids:
        result = await db.execute(select(Event).where(Event.id == event_id))
        event = result.scalar_one_or_none()
        if event is None:
            continue

        # Count members
        member_count_result = await db.execute(
            select(func.count(EventMember.id)).where(EventMember.event_id == event_id)
        )
        member_count = member_count_result.scalar() or 0

        # Count photos
        photo_count_result = await db.execute(
            select(func.count(Photo.id)).where(Photo.event_id == event_id)
        )
        photo_count = photo_count_result.scalar() or 0

        events_out.append({
            "id": event.id,
            "name": event.name,
            "description": event.description,
            "invite_code": event.invite_code,
            "host_id": event.host_id,
            "status": event.status,
            "created_at": event.created_at,
            "member_count": member_count,
            "photo_count": photo_count,
        })

    return events_out


async def get_event_detail(event_id: int, user_id: int, db: AsyncSession) -> dict:
    """Return full event detail including members. User must be a member."""
    # Check membership
    membership = await db.execute(
        select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
        )
    )
    if membership.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this event",
        )

    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Get members with user info
    from app.models.models import User
    members_result = await db.execute(
        select(EventMember, User.username).join(User, EventMember.user_id == User.id).where(
            EventMember.event_id == event_id
        )
    )
    members = []
    for member, username in members_result.all():
        members.append({
            "id": member.id,
            "user_id": member.user_id,
            "username": username,
            "role": member.role,
            "selfies_uploaded": member.selfies_uploaded,
            "joined_at": member.joined_at,
        })

    # Count photos
    photo_count_result = await db.execute(
        select(func.count(Photo.id)).where(Photo.event_id == event_id)
    )
    photo_count = photo_count_result.scalar() or 0

    return {
        "id": event.id,
        "name": event.name,
        "description": event.description,
        "invite_code": event.invite_code,
        "host": {
            "id": event.host.id,
            "email": event.host.email,
            "username": event.host.username,
            "avatar_url": event.host.avatar_url,
        },
        "status": event.status,
        "created_at": event.created_at,
        "members": members,
        "photo_count": photo_count,
    }


async def join_event(invite_code: str, user_id: int, db: AsyncSession) -> Event:
    """Join an event using an invite code. Returns the event."""
    result = await db.execute(
        select(Event).where(Event.invite_code == invite_code.upper())
    )
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code",
        )

    # Check if already a member
    existing = await db.execute(
        select(EventMember).where(
            EventMember.event_id == event.id,
            EventMember.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this event",
        )

    member = EventMember(
        event_id=event.id,
        user_id=user_id,
        role="member",
    )
    db.add(member)
    await db.flush()

    return event


async def verify_membership(event_id: int, user_id: int, db: AsyncSession) -> EventMember:
    """Verify user is a member of the event, raise 403 if not."""
    result = await db.execute(
        select(EventMember).where(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this event",
        )
    return member
