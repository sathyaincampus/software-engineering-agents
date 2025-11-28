import { Request, Response, NextFunction } from 'express';
import Reward from '../models/Reward';
import RewardRedemption from '../models/RewardRedemption';
import UserPoints from '../models/UserPoints';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../config/database';

// Helper function to get family_id from JWT payload
const getFamilyIdFromToken = (req: Request): string | null => {
  // Assuming JWT payload includes family_id after authentication middleware
  // This part depends on your authentication setup.
  // Example: return (req as any).auth?.family_id;
  // For now, let's assume it's passed in the request body for testing or fetched via user profile.
  // A more robust solution involves proper JWT payload extraction.
  return (req as any).user?.familyId || null;
};

// @desc    Get all rewards for a family
// @route   GET /api/v1/rewards
// @access  Private (Parent)
export const getRewards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const familyId = getFamilyIdFromToken(req);
    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found. Ensure user is authenticated and belongs to a family.' });
    }

    const rewards = await Reward.findAll({
      where: { family_id: familyId },
      order: [['point_cost', 'ASC']], // Order by point cost
    });

    res.status(200).json({ success: true, count: rewards.length, data: rewards });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single reward by ID
// @route   GET /api/v1/rewards/:id
// @access  Private (Parent)
export const getRewardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    const reward = await Reward.findOne({
      where: { reward_id: id, family_id: familyId },
    });

    if (!reward) {
      return res.status(404).json({ message: `Reward not found with id ${id} for this family` });
    }

    res.status(200).json({ success: true, data: reward });
  } catch (error) {
    console.error('Error fetching reward by ID:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new reward
// @route   POST /api/v1/rewards
// @access  Private (Parent)
export const createReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, point_cost, requires_approval } = req.body;
    const familyId = getFamilyIdFromToken(req);
    const createdBy = (req as any).user.userId; // Assuming userId is available from auth middleware

    if (!familyId) {
      return res.status(400).json({ message: 'Family ID is required and must be valid.' });
    }
    if (!name || point_cost === undefined || point_cost < 0) {
      return res.status(400).json({ message: 'Please provide name and a non-negative point cost for the reward.' });
    }

    const reward = await Reward.create({
      family_id: familyId,
      name,
      description,
      point_cost,
      requires_approval: requires_approval || false,
      created_by: createdBy,
    });

    res.status(201).json({ success: true, data: reward });
  } catch (error) {
    console.error('Error creating reward:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an existing reward
// @route   PUT /api/v1/rewards/:id
// @access  Private (Parent)
export const updateReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, point_cost, requires_approval } = req.body;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    // Find the reward ensuring it belongs to the family
    const reward = await Reward.findOne({
      where: { reward_id: id, family_id: familyId },
    });

    if (!reward) {
      return res.status(404).json({ message: `Reward not found with id ${id} for this family` });
    }

    // Update fields if they are provided in the request body
    if (name !== undefined) reward.name = name;
    if (description !== undefined) reward.description = description;
    if (point_cost !== undefined && point_cost >= 0) reward.point_cost = point_cost;
    if (requires_approval !== undefined) reward.requires_approval = requires_approval;

    await reward.save();

    res.status(200).json({ success: true, data: reward });
  } catch (error) {
    console.error('Error updating reward:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a reward
// @route   DELETE /api/v1/rewards/:id
// @access  Private (Parent)
export const deleteReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    // Find the reward ensuring it belongs to the family
    const reward = await Reward.findOne({
      where: { reward_id: id, family_id: familyId },
    });

    if (!reward) {
      return res.status(404).json({ message: `Reward not found with id ${id} for this family` });
    }

    // Before deleting, check if there are any pending redemptions for this reward
    const pendingRedemptions = await RewardRedemption.count({
      where: {
        reward_id: id,
        status: 'pending',
      },
    });

    if (pendingRedemptions > 0) {
      return res.status(400).json({
        message: `Cannot delete reward. There are ${pendingRedemptions} pending redemptions for this reward. Please resolve them first.`,
      });
    }

    await reward.destroy();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting reward:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Redeem a reward (for children)
// @route   POST /api/v1/rewards/:rewardId/redeem
// @access  Private (Child)
export const redeemReward = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { rewardId } = req.params;
    const userId = (req as any).user.userId; // User redeeming the reward
    const user = (req as any).user; // Assume user object with family_id is attached
    const familyId = user.family_id;

    if (!familyId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'User is not associated with a family.' });
    }

    // 1. Find the reward
    const reward = await Reward.findByPk(rewardId, { transaction });
    if (!reward) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Reward not found.' });
    }

    // 2. Check if reward belongs to the same family
    if (reward.family_id !== familyId) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Reward does not belong to your family.' });
    }

    // 3. Get the user's current points
    let userPoints = await UserPoints.findOne({ where: { user_id: userId }, transaction });
    if (!userPoints) {
      // User might not have a points entry yet if they haven't earned any
      // This scenario might be handled by user creation or a default entry
      userPoints = await UserPoints.create({ user_id: userId, current_points: 0 }, { transaction });
    }

    // 4. Check if the user has enough points
    if (userPoints.current_points < reward.point_cost) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Insufficient points to redeem this reward.' });
    }

    // 5. Create a redemption record
    const redemption = await RewardRedemption.create(
      {
        reward_id: reward.reward_id,
        user_id: userId,
        status: reward.requires_approval ? 'pending' : 'redeemed', // If approval needed, set to pending, else directly redeemed
        approved_by: reward.requires_approval ? null : (req as any).user.userId, // If not requiring approval, mark as approved by self (or system)
      },
      { transaction }
    );

    // 6. Deduct points only if not requiring approval or if deduction is part of the process
    // If approval is required, points are deducted *after* approval
    if (!reward.requires_approval) {
      const pointsDeducted = await userPoints.deductPoints(reward.point_cost);
      if (!pointsDeducted) {
        // This should ideally not happen due to the check above, but as a safeguard
        await transaction.rollback();
        return res.status(500).json({ message: 'Failed to deduct points during redemption.' });
      }
      // Update redemption status to redeemed if no approval needed and points deducted
      redemption.status = 'redeemed';
      redemption.approved_at = new Date();
      await redemption.save({ transaction });
    } else {
      // If approval is required, we might deduct points upon approval, or keep them until then.
      // For now, let's assume points are deducted upon approval. No action here.
      // You might want to notify the parent here using the notification service.
      console.log(`Reward redemption request pending approval for user ${userId} for reward ${rewardId}`);
    }

    await transaction.commit();
    res.status(201).json({ success: true, data: redemption, message: reward.requires_approval ? 'Reward redemption request submitted for approval.' : 'Reward redeemed successfully!' });

  } catch (error) {
    await transaction.rollback();
    console.error('Error redeeming reward:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get redemption history (for parents)
// @route   GET /api/v1/rewards/redemptions
// @access  Private (Parent)
export const getRedemptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const familyId = getFamilyIdFromToken(req);
    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    // Fetch all redemptions for the family, joining with user and reward details
    const redemptions = await RewardRedemption.findAll({
      where: {
        // Filter by family ID indirectly through user_id and reward family_id
        // This requires joining UserPoints and Users to get family_id, or reward table
      },
      include: [
        {
          model: Reward, // Assuming Reward model is imported
          as: 'reward',
          where: { family_id: familyId }, // Filter rewards by family ID
        },
        {
          model: UserPoints, // Assuming UserPoints model is imported
          as: 'userPoints',
          // This join is tricky, need to link user_id from redemption to UserPoints
          // A better approach might be to fetch user details separately or join Users
        },
        {
          model: sequelize.models.User, // Assuming User model is imported and available in sequelize.models
          as: 'user', // Alias for the user who redeemed
          attributes: ['user_id', 'display_name'], // Only fetch relevant user info
        },
        {
          model: sequelize.models.User, // Assuming User model is imported
          as: 'approver', // Alias for the user who approved
          attributes: ['user_id', 'display_name'],
        },
      ],
      order: [['redeemed_at', 'DESC']], // Order by redemption date descending
    });

    res.status(200).json({ success: true, count: redemptions.length, data: redemptions });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Approve or Reject a reward redemption (for parents)
// @route   PUT /api/v1/rewards/redemptions/:redemptionId/status
// @access  Private (Parent)
export const updateRedemptionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  try {
    const { redemptionId } = req.params;
    const { status } = req.body;
    const approverId = (req as any).user.userId; // The parent approving/rejecting
    const user = (req as any).user; // Assume user object with family_id is attached
    const familyId = user.family_id;

    if (!familyId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'User is not associated with a family.' });
    }

    if (!['approved', 'rejected', 'redeemed'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid status. Must be approved, rejected, or redeemed.' });
    }

    // 1. Find the redemption request
    const redemption = await RewardRedemption.findByPk(redemptionId, {
      // Include reward to check point cost and approval requirement
      include: [{ model: Reward, as: 'reward' }],
      transaction,
    });

    if (!redemption) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Reward redemption not found.' });
    }

    // 2. Authorization check: Ensure the approver belongs to the same family as the redemption
    if (redemption.reward.family_id !== familyId) {
       await transaction.rollback();
       return res.status(403).json({ message: 'Unauthorized to update this redemption status.' });
    }

    // 3. Update status and approved details
    redemption.status = status;
    redemption.approved_by = approverId;
    redemption.approved_at = new Date();

    // 4. If approved or directly redeemed, deduct points
    if (status === 'approved' || status === 'redeemed') {
      // Get the user's points
      let userPoints = await UserPoints.findOne({ where: { user_id: redemption.user_id }, transaction });
      if (!userPoints) {
        // This should not happen if points are managed correctly, but handle defensively
        await transaction.rollback();
        return res.status(404).json({ message: 'User points record not found.' });
      }

      // Deduct points
      const pointsDeducted = await userPoints.deductPoints(redemption.reward.point_cost);
      if (!pointsDeducted) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Insufficient points to fulfill this redemption.' });
      }

      // If status was 'approved', change it to 'redeemed' now that points are deducted
      if (status === 'approved') {
        redemption.status = 'redeemed';
      }

    } else if (status === 'rejected') {
      // If rejected, no points are deducted. The redemption record is simply updated.
      // We might want to notify the child here.
    }

    await redemption.save({ transaction });

    await transaction.commit();
    res.status(200).json({ success: true, data: redemption });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating redemption status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
