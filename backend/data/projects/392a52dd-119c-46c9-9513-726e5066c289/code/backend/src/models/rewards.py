from sqlalchemy import Column, String, ForeignKey, DateTime, UUID, Integer, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.database import Base
import uuid


class Reward(Base):
    __tablename__ = "rewards"

    reward_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(UUID(as_uuid=True), ForeignKey("family_members.family_id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    point_cost = Column(Integer, nullable=False, default=0)
    requires_approval = Column(Boolean, nullable=False, default=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Define relationship to redemption table
    # redemptions = relationship("RewardRedemption", back_populates="reward")


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    redemption_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    reward_id = Column(UUID(as_uuid=True), ForeignKey("rewards.reward_id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, nullable=False, default='pending') # e.g., 'pending', 'approved', 'rejected', 'completed'
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    # reward = relationship("Reward", back_populates="redemptions")
    # user = relationship("User") # Assumes User model is defined elsewhere

# NOTE: Ensure the 'UserPoints' model is also defined, likely in models/user_points.py
# with at least 'user_id' and 'current_points' columns.
# Example UserPoints model:
# class UserPoints(Base):
#     __tablename__ = "user_points"
#     user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), primary_key=True)
#     current_points = Column(Integer, nullable=False, default=0)
