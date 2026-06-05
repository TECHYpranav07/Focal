import random
import string
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_invite_code(length: int = 6) -> str:
    """Generate a random 6-character alphanumeric invite code."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    hosted_events = relationship("Event", back_populates="host", lazy="selectin")
    memberships = relationship("EventMember", back_populates="user", lazy="selectin")
    selfies = relationship("Selfie", back_populates="user", lazy="selectin")
    matches = relationship("Match", back_populates="user", lazy="selectin")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    invite_code = Column(String(6), unique=True, nullable=False, index=True, default=generate_invite_code)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum("active", "completed", "archived", name="event_status"),
        default="active",
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    host = relationship("User", back_populates="hosted_events", lazy="selectin")
    members = relationship("EventMember", back_populates="event", lazy="selectin")
    photos = relationship("Photo", back_populates="event", lazy="selectin")
    selfies = relationship("Selfie", back_populates="event", lazy="selectin")
    matches = relationship("Match", back_populates="event", lazy="selectin")


class EventMember(Base):
    __tablename__ = "event_members"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_event_member"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(
        Enum("host", "member", name="member_role"),
        default="member",
        nullable=False,
    )
    selfies_uploaded = Column(Integer, default=0, nullable=False)
    joined_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="members", lazy="selectin")
    user = relationship("User", back_populates="memberships", lazy="selectin")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    processing_status = Column(
        Enum("pending", "processing", "completed", "failed", name="processing_status"),
        default="pending",
        nullable=False,
    )
    face_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="photos", lazy="selectin")
    uploader = relationship("User", lazy="selectin")
    face_embeddings = relationship("FaceEmbedding", back_populates="photo", lazy="selectin")
    matches = relationship("Match", back_populates="photo", lazy="selectin")

    @property
    def faces(self) -> list[dict]:
        details = []
        for fe in self.face_embeddings:
            matched_user_id = None
            matched_username = None
            similarity_score = None
            
            if fe.matches:
                # Get the match with the highest similarity score
                best_match = max(fe.matches, key=lambda m: m.similarity_score)
                matched_user_id = best_match.user_id
                matched_username = best_match.user.username if best_match.user else None
                similarity_score = best_match.similarity_score
                
            details.append({
                "id": fe.id,
                "bbox_x": fe.bbox_x,
                "bbox_y": fe.bbox_y,
                "bbox_w": fe.bbox_w,
                "bbox_h": fe.bbox_h,
                "matched_user_id": matched_user_id,
                "matched_username": matched_username,
                "similarity_score": similarity_score,
            })
        return details


class Selfie(Base):
    __tablename__ = "selfies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    embedding = Column(LargeBinary, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="selfies", lazy="selectin")
    user = relationship("User", back_populates="selfies", lazy="selectin")


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    embedding = Column(LargeBinary, nullable=False)
    bbox_x = Column(Integer, default=0)
    bbox_y = Column(Integer, default=0)
    bbox_w = Column(Integer, default=0)
    bbox_h = Column(Integer, default=0)
    detection_confidence = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    photo = relationship("Photo", back_populates="face_embeddings", lazy="selectin")
    matches = relationship("Match", back_populates="face_embedding", lazy="selectin")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    face_embedding_id = Column(Integer, ForeignKey("face_embeddings.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="matches", lazy="selectin")
    photo = relationship("Photo", back_populates="matches", lazy="selectin")
    user = relationship("User", back_populates="matches", lazy="selectin")
    face_embedding = relationship("FaceEmbedding", back_populates="matches", lazy="selectin")
