from pydantic import BaseModel, Field, validator
import uuid
from datetime import datetime
from typing import Optional, List


class RewardBase(BaseModel):
    name: str = Field(..., example="Extra Hour of Playtime")
    description: Optional[str] = Field(None, example="Enjoy an additional hour of fun!")
    point_cost: int = Field(..., gt=0, example=50)
    requires_approval: bool = Field(default=False, example=True)


class RewardCreate(RewardBase):
    family_id: uuid.UUID


class Reward(RewardBase):
    reward_id: uuid.UUID
    family_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class RewardRedemptionBase(BaseModel):
    reward_id: uuid.UUID
    user_id: uuid.UUID # User who is redeeming the reward (typically a child)


class RewardRedemptionCreate(RewardRedemptionBase):
    pass


class RewardRedemption(RewardRedemptionBase):
    redemption_id: uuid.UUID
    redeemed_at: datetime
    status: str # e.g., 'pending', 'approved', 'rejected', 'completed'
    approved_by: Optional[uuid.UUID] = None # UserID of the approver (parent)
    approved_at: Optional[datetime] = None

    class Config:
        orm_mode = True

