from sqlalchemy import Column, String, ForeignKey, DateTime, UUID
from sqlalchemy.sql import func
from backend.src.database import Base
import uuid


class CustomCategory(Base):
    __tablename__ = "custom_categories"

    category_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.family_id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    color = Column(String, nullable=False)  # e.g., "#FF5733"
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Note: You would typically define a relationship here to link back to the Family and User models,
    # and potentially to Event and Task models if you want to manage cascading deletes or 
    # check for related records before deletion.
    # Example relationships (assuming they are defined in other model files):
    # family = relationship("FamilyMember") # Or your Family model
    # creator = relationship("User")
    # events = relationship("Event", back_populates="event_category")
    # tasks = relationship("Task", back_populates="task_category") # If tasks also use categories
