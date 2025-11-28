from sqlalchemy import Column, UUID, VARCHAR, TEXT, TIMESTAMP WITH TIME ZONE, BOOLEAN, INTEGER, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from backend.src.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    email = Column(VARCHAR(255), unique=True, index=True, nullable=False)
    password_hash = Column(VARCHAR(255), nullable=True) # Nullable for OAuth users
    google_id = Column(VARCHAR(255), unique=True, nullable=True)
    display_name = Column(VARCHAR(100), nullable=False)
    avatar_url = Column(VARCHAR(255), nullable=True)
    role = Column(VARCHAR(50), nullable=False, default='child') # e.g., 'child', 'parent'
    parent_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True)
    created_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')
    updated_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()', onupdate='NOW()')

    # Relationships
    parent = relationship("User", remote_side=[user_id])
    children = relationship("User", back_populates="parent") # If a user can be a parent to other users
    family_members = relationship("FamilyMember", back_populates="user")
    tasks_assigned = relationship("Task", back_populates="assigned_to_user")
    tasks_created = relationship("Task", back_populates="creator")
    events_created = relationship("Event", back_populates="creator")
    rewards_created = relationship("Reward", back_populates="creator")
    reward_redemptions = relationship("RewardRedemption", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    # Note: UserPoints is a 1-to-1 relationship, handled directly
    

class FamilyMember(Base):
    __tablename__ = "family_members"

    # Composite primary key to allow a user to belong to multiple families if needed, 
    # or a single family_id if families are grouped differently.
    # Based on schema provided, family_id is PK and member_id is FK. 
    # This implies family_id is an identifier for a group and member_id links a user to it.
    # If a user can be in multiple families, this structure would need adjustment 
    # (e.g., family_id, member_id as composite PK).
    # For now, adhering to the provided schema where family_id is PK implies a unique group ID.
    # However, the FK from events/tasks to family_id implies that family_id here is the group identifier.
    # Let's assume the schema implies a structure where `family_id` in `family_members` is a unique group identifier,
    # and `member_id` is the user's ID within that group.
    # If `family_id` should be part of a composite key or relate to a separate `families` table,
    # this would need refinement.
    family_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    member_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    role_in_family = Column(VARCHAR(50), nullable=False) # e.g., 'primary_parent', 'child', 'other_relative'

    # Relationships
    user = relationship("User", back_populates="family_members")


class Event(Base):
    __tablename__ = "events"

    event_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(PG_UUID(as_uuid=True), ForeignKey('family_members.family_id'), nullable=False)
    title = Column(VARCHAR(255), nullable=False)
    description = Column(TEXT, nullable=True)
    start_time = Column(TIMESTAMP WITH TIME ZONE, nullable=False)
    end_time = Column(TIMESTAMP WITH TIME ZONE, nullable=False)
    assigned_to = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True)
    event_category_id = Column(PG_UUID(as_uuid=True), ForeignKey('event_categories.category_id'), nullable=True)
    location = Column(VARCHAR(255), nullable=True)
    is_recurring = Column(BOOLEAN, default=False)
    recurrence_rule = Column(TEXT, nullable=True)
    recurring_end_date = Column(TIMESTAMP WITH TIME ZONE, nullable=True) # Changed to TIMESTAMP for consistency with start/end_time
    original_event_id = Column(PG_UUID(as_uuid=True), ForeignKey('events.event_id'), nullable=True)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    created_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')
    updated_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()', onupdate='NOW()')

    # Relationships
    creator = relationship("User", back_populates="events_created", foreign_keys=[created_by])
    assignee = relationship("User", foreign_keys=[assigned_to])
    event_category = relationship("EventCategory", back_populates="events")
    original_event = relationship("Event", remote_side=[event_id], back_populates="recurring_events")
    recurring_events = relationship("Event", back_populates="original_event", foreign_keys=[original_event_id])


class EventCategory(Base):
    __tablename__ = "event_categories"

    category_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(PG_UUID(as_uuid=True), ForeignKey('family_members.family_id'), nullable=False)
    name = Column(VARCHAR(100), nullable=False)
    color = Column(VARCHAR(7), nullable=False) # e.g., '#FF5733'

    # Relationships
    events = relationship("Event", back_populates="event_category")


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(PG_UUID(as_uuid=True), ForeignKey('family_members.family_id'), nullable=False)
    title = Column(VARCHAR(255), nullable=False)
    description = Column(TEXT, nullable=True)
    assigned_to = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    due_date = Column(TIMESTAMP WITH TIME ZONE, nullable=True)
    points = Column(INTEGER, default=0)
    status = Column(VARCHAR(50), nullable=False, default='pending') # e.g., 'pending', 'in_progress', 'completed', 'overdue'
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    created_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')
    updated_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()', onupdate='NOW()')

    # Relationships
    creator = relationship("User", back_populates="tasks_created", foreign_keys=[created_by])
    assigned_to_user = relationship("User", back_populates="tasks_assigned", foreign_keys=[assigned_to])


class Reward(Base):
    __tablename__ = "rewards"

    reward_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    family_id = Column(PG_UUID(as_uuid=True), ForeignKey('family_members.family_id'), nullable=False)
    name = Column(VARCHAR(100), nullable=False)
    description = Column(TEXT, nullable=True)
    point_cost = Column(INTEGER, default=0)
    requires_approval = Column(BOOLEAN, default=False)
    created_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    created_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')
    updated_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()', onupdate='NOW()')

    # Relationships
    creator = relationship("User", back_populates="rewards_created", foreign_keys=[created_by])
    reward_redemptions = relationship("RewardRedemption", back_populates="reward")


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    redemption_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    reward_id = Column(PG_UUID(as_uuid=True), ForeignKey('rewards.reward_id'), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    redeemed_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')
    status = Column(VARCHAR(50), nullable=False, default='pending') # e.g., 'pending', 'approved', 'rejected', 'fulfilled'
    approved_by = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=True)
    approved_at = Column(TIMESTAMP WITH TIME ZONE, nullable=True)

    # Relationships
    reward = relationship("Reward", back_populates="reward_redemptions")
    user = relationship("User", back_populates="reward_redemptions", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])


class UserPoints(Base):
    __tablename__ = "user_points"

    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), primary_key=True)
    current_points = Column(INTEGER, nullable=False, default=0)

    # Relationship
    user = relationship("User", back_populates=None) # No back_populates needed for 1-to-1 from User side


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    message = Column(TEXT, nullable=False)
    type = Column(VARCHAR(50), nullable=False) # e.g., 'task_assigned', 'event_reminder', 'reward_approved'
    read_status = Column(BOOLEAN, default=False)
    created_at = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')

    # Relationship
    user = relationship("User", back_populates="notifications")


class Subscription(Base):
    __tablename__ = "subscriptions"

    subscription_id = Column(PG_UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.user_id'), nullable=False)
    plan_name = Column(VARCHAR(100), nullable=False) # e.g., 'free', 'premium'
    start_date = Column(TIMESTAMP WITH TIME ZONE, nullable=False, server_default='NOW()')
    end_date = Column(TIMESTAMP WITH TIME ZONE, nullable=True)
    status = Column(VARCHAR(50), nullable=False, default='active') # e.g., 'active', 'canceled', 'expired'
    payment_gateway_subscription_id = Column(VARCHAR(255), nullable=True)

    # Relationship
    user = relationship("User", back_populates="subscriptions")

