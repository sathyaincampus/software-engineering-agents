from sqlalchemy import Column, String, ForeignKey, DateTime, UUID, Integer, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.database import Base
import uuid


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.family_id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    due_date = Column(DATE, nullable=True)
    points = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default='pending') # e.g., 'pending', 'in_progress', 'completed'
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    task_category_id = Column(UUID(as_uuid=True), ForeignKey('custom_categories.category_id'), nullable=True) # Link to custom categories

    # Relationships (define based on your User and Category models)
    # assigned_user = relationship("User", foreign_keys=[assigned_to])
    # creator_user = relationship("User", foreign_keys=[created_by])
    # category = relationship("CustomCategory", back_populates="tasks")

