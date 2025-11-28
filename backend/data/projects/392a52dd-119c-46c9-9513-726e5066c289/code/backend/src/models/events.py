from sqlalchemy import Column, String, ForeignKey, DateTime, UUID, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.database import Base
import uuid


class Event(Base):
    __tablename__ = "events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.family_id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    event_category_id = Column(UUID(as_uuid=True), ForeignKey("event_categories.category_id"), nullable=True)
    location = Column(String, nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(Text, nullable=True) # e.g., RRULE string from iCalendar
    recurring_end_date = Column(DATE, nullable=True)
    original_event_id = Column(UUID(as_uuid=True), ForeignKey("events.event_id"), nullable=True) # For recurring event instances
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (define based on your User and EventCategory models)
    # assigned_user = relationship("User", foreign_keys=[assigned_to])
    # category = relationship("EventCategory", back_populates="events")
    # creator_user = relationship("User", foreign_keys=[created_by])


class EventCategory(Base):
    __tablename__ = "event_categories"

    category_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.family_id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    color = Column(String(7), nullable=False) # Hex color code, e.g., "#FF5733"

    # Define relationship to events table
    # events = relationship("Event", back_populates="category")

# NOTE: Ensure relationships are properly defined in User and EventCategory models if needed.
