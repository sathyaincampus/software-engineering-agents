import express from 'express';
import { 
  getRewards, 
  getRewardById, 
  createReward, 
  updateReward, 
  deleteReward, 
  redeemReward, 
  getRedemptions, 
  updateRedemptionStatus 
} from '../controllers/rewardController';
import { protect, authorize } from '../middleware/authMiddleware'; // Assuming you have auth middleware

const router = express.Router();

// Routes for managing rewards (typically by parents)
router.route('/')
  .get(protect, authorize('parent'), getRewards)
  .post(protect, authorize('parent'), createReward);

router.route('/:id')
  .get(protect, authorize('parent'), getRewardById)
  .put(protect, authorize('parent'), updateReward)
  .delete(protect, authorize('parent'), deleteReward);

// Routes for reward redemptions (children redeem, parents manage)
router.route('/redemptions')
  .get(protect, authorize('parent'), getRedemptions); // Get all redemptions for the family (parent view)

router.route('/:rewardId/redeem')
  .post(protect, authorize('child'), redeemReward); // Child redeems a reward

router.route('/redemptions/:redemptionId/status')
  .put(protect, authorize('parent'), updateRedemptionStatus); // Parent approves/rejects/updates status

export default router;
