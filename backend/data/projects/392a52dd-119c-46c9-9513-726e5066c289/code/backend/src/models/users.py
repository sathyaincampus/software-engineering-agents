# Assuming users.py exists and defines the User model.
# Example structure:
from sqlalchemy import Column, String, Boolean, DateTime, UUID, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    display_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    role = Column(String, nullable=False, default='child') # e.g., 'parent', 'child'
    family_id = Column(UUID(as_uuid=True), ForeignKey('family_members.family_id'), nullable=True) # Link to the family they belong to
    parent_id = Column(UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True) # For child-parent relationship within the same family
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Example relationships (adjust based on your actual models)
    # family_member_relation = relationship("FamilyMember", back_populates="user") # If you have FamilyMember table
    # children = relationship("User", remote_side=[user_id]) # If a user can have multiple children entries

    # Relationships for messages
    # sent_messages = relationship("Message", foreign_keys="[Message.sender_id]", back_populates="sender")
    # received_messages = relationship("Message", foreign_keys="[Message.receiver_id]", back_populates="receiver")
    # conversations_as_parent = relationship("Conversation", foreign_keys="[Conversation.parent_id]")
    # conversations_as_child = relationship("Conversation", foreign_keys="[Conversation.child_id]")


# NOTE: The User model here is a placeholder. Ensure it matches your actual User model definition,
# especially regarding `user_id`, `family_id`, `role`, and any relationships needed for messages/conversations.
# The User model must have `user_id` as a UUID and `family_id` as a UUID.
