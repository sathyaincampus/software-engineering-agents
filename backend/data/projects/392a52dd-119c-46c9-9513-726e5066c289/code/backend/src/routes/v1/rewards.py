from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from backend.src.schemas.rewards import RewardCreate, Reward, RewardRedemptionCreate, RewardRedemption
from backend.src.crud.rewards import (
    create_reward_db, get_rewards_by_family_db, get_reward_by_id_db,
    update_reward_db, delete_reward_db,
    create_reward_redemption_db, get_reward_redemptions_by_user_db,
    get_reward_redemption_by_id_db, update_reward_redemption_db
)
from backend.src.crud.tasks import get_task_point_values_db # Assuming a similar function exists for tasks
from backend.src.crud.users import get_user_db
from backend.src.dependencies import get_db, get_current_user
from backend.src.models.users import User

router = APIRouter(
    prefix="/rewards",
    tags=["Rewards"],
)


# --- Reward Endpoints ---

@router.post("/", response_model=Reward, status_code=status.HTTP_201_CREATED)
def create_reward(
    reward: RewardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new reward that can be redeemed by family members.

    - **family_id**: The ID of the family the reward belongs to.
    - **name**: The name of the reward (e.g., "Extra Screen Time").
    - **description**: A description of the reward.
    - **point_cost**: The number of points required to redeem the reward.
    - **requires_approval**: Boolean indicating if the reward redemption needs parental approval.
    """
    # Authorization: Ensure the user belongs to the family they are creating a reward for.
    if current_user.family_id != reward.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create rewards for your own family."
        )

    try:
        return create_reward_db(db, reward, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/", response_model=List[Reward])
def read_rewards(
    family_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a list of all rewards for a specific family.

    - **family_id**: The ID of the family whose rewards to retrieve.
    """
    # Authorization: Ensure the user belongs to the requested family.
    if current_user.family_id != family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view rewards for this family."
        )

    rewards = get_rewards_by_family_db(db, family_id)
    return rewards


@router.get("/{reward_id}", response_model=Reward)
def read_reward(
    reward_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves a specific reward by its ID.

    - **reward_id**: The unique identifier of the reward.
    """
    db_reward = get_reward_by_id_db(db, reward_id)
    if db_reward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found.")

    # Authorization: Ensure the user belongs to the family of the reward.
    if current_user.family_id != db_reward.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this reward."
        )

    return db_reward


@router.put("/{reward_id}", response_model=Reward)
def update_reward(
    reward_id: uuid.UUID,
    reward_update: RewardCreate,  # Using create schema for update, assumes all fields are updatable
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates an existing reward.

    - **reward_id**: The unique identifier of the reward to update.
    - **name**: The new name of the reward.
    - **description**: The new description.
    - **point_cost**: The new point cost.
    - **requires_approval**: The new approval requirement.
    """
    db_reward = get_reward_by_id_db(db, reward_id)
    if db_reward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found.")

    # Authorization: Ensure the user belongs to the family of the reward.
    if current_user.family_id != db_reward.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this reward."
        )
    
    # Also ensure the updated data's family_id matches the existing one
    if current_user.family_id != reward_update.family_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the family association of a reward."
        )

    try:
        updated_reward = update_reward_db(db, reward_id, reward_update)
        return updated_reward
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reward(
    reward_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a reward by its ID.

    - **reward_id**: The unique identifier of the reward to delete.
    """
    db_reward = get_reward_by_id_db(db, reward_id)
    if db_reward is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found.")

    # Authorization: Ensure the user belongs to the family of the reward.
    if current_user.family_id != db_reward.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this reward."
        )

    try:
        deleted = delete_reward_db(db, reward_id)
        if not deleted:
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete reward: it has associated redemptions.")
        return
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


# --- Reward Redemption Endpoints ---

@router.post("/redemptions/", response_model=RewardRedemption, status_code=status.HTTP_201_CREATED)
def redeem_reward(
    redemption: RewardRedemptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new reward redemption request.

    - **reward_id**: The ID of the reward being redeemed.
    - **user_id**: The ID of the user requesting the redemption (should be the child).
    """
    reward = get_reward_by_id_db(db, redemption.reward_id)
    if not reward:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found.")

    # Authorization: Ensure the user redeeming is part of the family and is a child,
    # and that the reward belongs to the same family.
    if current_user.family_id != reward.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reward does not belong to your family."
        )
    if current_user.user_id != redemption.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only redeem rewards for yourself."
        )
    if current_user.role != 'child':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only children can redeem rewards."
        )

    try:
        # Check if user has enough points (This logic might live in crud or service layer)
        user_points = db.query(UserPoints).filter(UserPoints.user_id == current_user.user_id).first()
        if not user_points or user_points.current_points < reward.point_cost:
            raise ValueError("Insufficient points to redeem this reward.")

        new_redemption = create_reward_redemption_db(db, redemption, current_user.user_id)

        # Deduct points
        user_points.current_points -= reward.point_cost
        db.commit()

        # Potentially send notification to parent if approval is required

        return new_redemption
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/redemptions/me/", response_model=List[RewardRedemption])
def read_my_reward_redemptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all reward redemptions made by the current user (child).
    """
    try:
        redemptions = get_reward_redemptions_by_user_db(db, current_user.user_id)
        return redemptions
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.get("/redemptions/pending/", response_model=List[RewardRedemption])
def read_pending_redemptions(
    family_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all pending reward redemptions for a given family, visible to parents.

    - **family_id**: The ID of the family.
    """
    # Authorization: Ensure the user is a parent and belongs to the family.
    if current_user.family_id != family_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view redemptions for another family.")
    if current_user.role != 'parent':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can view pending redemptions.")

    try:
        # Fetch redemptions for the family where status is 'pending'
        pending_redemptions = db.query(RewardRedemption)
        pending_redemptions = pending_redemptions.join(RewardRedemption.reward)
        pending_redemptions = pending_redemptions.filter(
            RewardRedemption.status == 'pending',
            Reward.family_id == family_id
        )
        return pending_redemptions.all()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.put("/redemptions/{redemption_id}/approve/", response_model=RewardRedemption)
def approve_reward_redemption(
    redemption_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approves a pending reward redemption.

    - **redemption_id**: The ID of the redemption to approve.
    """
    redemption = get_reward_redemption_by_id_db(db, redemption_id)
    if not redemption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redemption not found.")

    # Authorization: Ensure the approver is a parent in the same family and the redemption is pending.
    if current_user.family_id != redemption.user.family_id: # Assuming User model has family_id
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot approve redemption from another family.")
    if current_user.role != 'parent':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can approve redemptions.")
    if redemption.status != 'pending':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Redemption is not in pending status.")

    try:
        updated_redemption = update_reward_redemption_db(db, redemption_id, 'approved', current_user.user_id)
        
        # Optionally, update user points if the reward was fulfilled (deducted from a separate reward balance maybe)
        # For now, approval just changes status.
        
        return updated_redemption
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


@router.put("/redemptions/{redemption_id}/reject/", response_model=RewardRedemption)
def reject_reward_redemption(
    redemption_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rejects a pending reward redemption.

    - **redemption_id**: The ID of the redemption to reject.
    """
    redemption = get_reward_redemption_by_id_db(db, redemption_id)
    if not redemption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redemption not found.")

    # Authorization: Ensure the approver is a parent in the same family and the redemption is pending.
    if current_user.family_id != redemption.user.family_id: # Assuming User model has family_id
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot reject redemption from another family.")
    if current_user.role != 'parent':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parents can reject redemptions.")
    if redemption.status != 'pending':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Redemption is not in pending status.")

    try:
        updated_redemption = update_reward_redemption_db(db, redemption_id, 'rejected', current_user.user_id)
        
        # Refund points if they were deducted upon creation
        # This requires more complex logic, e.g., checking if points were already deducted or if deduction happens on approval.
        # For now, just changing status.

        return updated_redemption
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")


# NOTE: The UserPoints model needs to be defined and imported.
# Example: Assuming UserPoints table with user_id and current_points
# from backend.src.models.user_points import UserPoints

