from sqlalchemy import Column, String, ForeignKey, DateTime, UUID, Text
from sqlalchemy.sql import func
from backend.src.database import Base
import uuid

class Message(Base):
    __tablename__ = "messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.conversation_id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

class Conversation(Base):
    __tablename__ = "conversations"

    conversation_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.family_id"), nullable=False, index=True)
    # Participants can be implicitly derived from messages or explicitly stored.
    # For a simple parent-child messaging, we can assume a conversation links a parent and a child.
    # A more robust system might have a participants table.
    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    child_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Add unique constraint to prevent duplicate conversations between the same parent/child pair
    __table_args__ = (
        UniqueConstraint('parent_id', 'child_id', name='uq_conversation_parent_child'),
        UniqueConstraint('child_id', 'parent_id', name='uq_conversation_child_parent') # For reverse order
    )

    # Define relationships if needed, e.g.:
    # parent = relationship("User", foreign_keys=[parent_id])
    # child = relationship("User", foreign_keys=[child_id])
    # messages = relationship("Message", back_populates="conversation")
