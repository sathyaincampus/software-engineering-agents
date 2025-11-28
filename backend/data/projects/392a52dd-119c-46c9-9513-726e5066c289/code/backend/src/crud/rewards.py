from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import desc
import uuid

from backend.src.models.rewards import Reward as DBReward, RewardRedemption as DBRewardRedemption
from backend.src.schemas.rewards import RewardCreate, RewardRedemptionCreate
from backend.src.models.users import User
from backend.src.models.user_points import UserPoints # Import UserPoints model


def create_reward_db(db: Session, reward: RewardCreate, created_by_user_id: uuid.UUID):
    """
    Creates a new reward in the database.
    """
    db_reward = DBReward(
        reward_id=uuid.uuid4(),
        family_id=reward.family_id,
        name=reward.name,
        description=reward.description,
        point_cost=reward.point_cost,
        requires_approval=reward.requires_approval,
        created_by=created_by_user_id
    )
    try:
        db.add(db_reward)
        db.commit()
        db.refresh(db_reward)
        return db_reward
    except IntegrityError:
        db.rollback()
        raise ValueError("Reward name might already exist for this family.")
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during reward creation: {e}")


def get_rewards_by_family_db(db: Session, family_id: uuid.UUID):
    """
    Retrieves all rewards for a given family ID.
    """
    try:
        return db.query(DBReward).filter(DBReward.family_id == family_id).all()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching rewards: {e}")

def get_reward_by_id_db(db: Session, reward_id: uuid.UUID):
    """
    Retrieves a single reward by its ID.
    """
    try:
        return db.query(DBReward).filter(DBReward.reward_id == reward_id).first()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching reward by ID: {e}")

def update_reward_db(db: Session, reward_id: uuid.UUID, reward_update: RewardCreate):
    """
    Updates an existing reward in the database.
    """
    db_reward = get_reward_by_id_db(db, reward_id)
    if not db_reward:
        return None

    # Ensure family_id consistency
    if db_reward.family_id != reward_update.family_id:
         raise ValueError("Cannot change the family association of an existing reward via update.")

    try:
        db_reward.name = reward_update.name
        db_reward.description = reward_update.description
        db_reward.point_cost = reward_update.point_cost
        db_reward.requires_approval = reward_update.requires_approval
        db.commit()
        db.refresh(db_reward)
        return db_reward
    except IntegrityError:
        db.rollback()
        raise ValueError("Reward name might already exist for this family.")
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during reward update: {e}")

def delete_reward_db(db: Session, reward_id: uuid.UUID):
    """
    Deletes a reward from the database.
    Returns True if successful, False if the reward has associated redemptions.
    """
    db_reward = get_reward_by_id_db(db, reward_id)
    if not db_reward:
        return False

    try:
        # Check if there are any associated redemptions
        redemptions = db.query(DBRewardRedemption).filter(DBRewardRedemption.reward_id == reward_id).count()
        if redemptions > 0:
            # Optionally, you might want to soft-delete or archive instead of hard delete.
            # For now, prevent deletion if redemptions exist.
            raise ValueError("Cannot delete reward: It has associated redemptions.")

        db.delete(db_reward)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during reward deletion: {e}")


def create_reward_redemption_db(db: Session, redemption: RewardRedemptionCreate, redeeming_user_id: uuid.UUID):
    """
    Creates a new reward redemption entry.
    """
    # Fetch the associated reward to check its properties (like requires_approval)
    reward = get_reward_by_id_db(db, redemption.reward_id)
    if not reward:
        raise ValueError("Associated reward not found.")

    # Fetch the user redeeming the reward to check points and family context
    redeeming_user = db.query(User).filter(User.user_id == redeeming_user_id).first()
    if not redeeming_user:
        raise ValueError("Redeeming user not found.")
    if redeeming_user.family_id != reward.family_id:
        raise ValueError("Reward and user do not belong to the same family.")
    if redeeming_user.user_id != redemption.user_id:
        raise ValueError("User ID mismatch in redemption request.")
    if redeeming_user.role != 'child':
        raise ValueError("Only children can redeem rewards.")

    # Check for sufficient points (This might be handled before calling this crud function)
    user_points = db.query(UserPoints).filter(UserPoints.user_id == redeeming_user_id).first()
    if not user_points or user_points.current_points < reward.point_cost:
        raise ValueError("Insufficient points.")

    db_redemption = DBRewardRedemption(
        redemption_id=uuid.uuid4(),
        reward_id=redemption.reward_id,
        user_id=redemption.user_id,
        status='pending' if reward.requires_approval else 'approved', # Set initial status
        approved_by=None if reward.requires_approval else redeeming_user_id # Set approver if no approval needed
    )

    try:
        db.add(db_redemption)
        
        # Deduct points immediately if approval is not required, otherwise deduct upon approval.
        # For simplicity here, let's deduct points assuming the creation implies intent to use.
        if not reward.requires_approval:
            user_points.current_points -= reward.point_cost
            db.commit()
        # If approval is required, points deduction will happen in the 'approve' function.
        else:
            db.commit() # Commit redemption first
            
        db.refresh(db_redemption)
        return db_redemption
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred during reward redemption creation: {e}")


def get_reward_redemptions_by_user_db(db: Session, user_id: uuid.UUID):
    """
    Retrieves all reward redemptions for a given user.
    """
    try:
        # Join with rewards table to include reward details like name and point cost
        return db.query(DBRewardRedemption)
                .options(joinedload(DBRewardRedemption.reward))
                .filter(DBRewardRedemption.user_id == user_id)
                .order_by(desc(DBRewardRedemption.redeemed_at))
                .all()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching redemptions for user: {e}")


def get_reward_redemption_by_id_db(db: Session, redemption_id: uuid.UUID):
    """
    Retrieves a single reward redemption by its ID.
    """
    try:
        return db.query(DBRewardRedemption)
                .options(joinedload(DBRewardRedemption.user), joinedload(DBRewardRedemption.reward))
                .filter(DBRewardRedemption.redemption_id == redemption_id)
                .first()
    except SQLAlchemyError as e:
        raise Exception(f"Database error occurred while fetching redemption by ID: {e}")

def update_reward_redemption_db(db: Session, redemption_id: uuid.UUID, new_status: str, approved_by_user_id: UUID):
    """
    Updates the status of a reward redemption and sets the approver.
    """
    db_redemption = get_reward_redemption_by_id_db(db, redemption_id)
    if not db_redemption:
        return None

    # Validate status transition (e.g., only pending can be approved/rejected)
    if db_redemption.status != 'pending':
        raise ValueError("Redemption is not in pending status.")

    # Validate role of the user performing the update
    approver = db.query(User).filter(User.user_id == approved_by_user_id).first()
    if not approver or approver.role != 'parent':
        raise ValueError("Only parents can approve/reject redemptions.")
    if approver.family_id != db_redemption.user.family_id:
        raise ValueError("Approver must be from the same family.")

    try:
        db_redemption.status = new_status
        db_redemption.approved_by = approved_by_user_id
        db_redemption.approved_at = func.now()
        
        # If approved, and points were not deducted initially, deduct them now.
        # This logic depends on the exact flow. If points are deducted on creation for non-approval-required items,
        # and only deducted on approval for approval-required items, this part needs careful implementation.
        # For simplicity, assuming deduction occurs upon approval if required.
        if new_status == 'approved' and db_redemption.reward.requires_approval:
            user_points = db.query(UserPoints).filter(UserPoints.user_id == db_redemption.user_id).first()
            if user_points and user_points.current_points >= db_redemption.reward.point_cost:
                 user_points.current_points -= db_redemption.reward.point_cost
            else:
                # This case should ideally be prevented by checks during initial creation/redemption request
                db.rollback()
                raise ValueError("Cannot approve: insufficient points after all.")

        db.commit()
        db.refresh(db_redemption)
        return db_redemption
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Database error occurred while updating redemption status: {e}")

