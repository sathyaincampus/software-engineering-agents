from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=100)

class UserCreateSchema(UserBase):
    password: str = Field(..., min_length=8)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserSchema(UserBase):
    user_id: uuid.UUID
    avatar_url: str | None = None
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FamilyMemberBase(BaseModel):
    role_in_family: str

class FamilyMemberCreateSchema(FamilyMemberBase):
    member_id: uuid.UUID

class FamilyMemberSchema(FamilyMemberBase):
    family_id: uuid.UUID
    member_id: uuid.UUID

    class Config:
        from_attributes = True

class EventCategoryBase(BaseModel):
    name: str
    color: str

class EventCategoryCreateSchema(EventCategoryBase):
    pass

class EventCategorySchema(EventCategoryBase):
    category_id: uuid.UUID
    family_id: uuid.UUID

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    assigned_to: uuid.UUID | None = None
    event_category_id: uuid.UUID | None = None
    location: str | None = None
    is_recurring: bool = False
    recurrence_rule: str | None = None
    recurring_end_date: datetime | None = None
    original_event_id: uuid.UUID | None = None

class EventCreateSchema(EventBase):
    pass

class EventSchema(EventBase):
    event_id: uuid.UUID
    family_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None
    points: int = 0
    status: str = "pending"

class TaskCreateSchema(TaskBase):
    assigned_to: uuid.UUID

class TaskSchema(TaskBase):
    task_id: uuid.UUID
    family_id: uuid.UUID
    created_by: uuid.UUID
    assigned_to: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RewardBase(BaseModel):
    name: str
    description: str | None = None
    point_cost: int = 0
    requires_approval: bool = False

class RewardCreateSchema(RewardBase):
    pass

class RewardSchema(RewardBase):
    reward_id: uuid.UUID
    family_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RewardRedemptionBase(BaseModel):
    status: str = "pending"

class RewardRedemptionCreateSchema(RewardRedemptionBase):
    reward_id: uuid.UUID

class RewardRedemptionSchema(RewardRedemptionBase):
    redemption_id: uuid.UUID
    reward_id: uuid.UUID
    user_id: uuid.UUID
    redeemed_at: datetime
    approved_by: uuid.UUID | None = None
    approved_at: datetime | None = None

    class Config:
        from_attributes = True

class UserPointsBase(BaseModel):
    current_points: int = 0

class UserPointsSchema(UserPointsBase):
    user_id: uuid.UUID

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    message: str
    type: str
    read_status: bool = False

class NotificationCreateSchema(NotificationBase):
    pass

class NotificationSchema(NotificationBase):
    notification_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    plan_name: str
    status: str = "active"

class SubscriptionCreateSchema(SubscriptionBase):
    payment_gateway_subscription_id: str | None = None

class SubscriptionSchema(SubscriptionBase):
    subscription_id: uuid.UUID
    user_id: uuid.UUID
    start_date: datetime
    end_date: datetime | None = None
    payment_gateway_subscription_id: str | None = None

    class Config:
        from_attributes = True

