import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Define the possible statuses for a reward redemption
export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'redeemed';

// Define the attributes of a RewardRedemption
interface RewardRedemptionAttributes {
  redemption_id: string;
  reward_id: string;
  user_id: string; // The user (child) who redeemed the reward
  redeemed_at: Date;
  status: RedemptionStatus;
  approved_by: string | null; // The user (parent) who approved/rejected it
  approved_at: Date | null;
}

// Define the properties of a RewardRedemption instance, including creation attributes
interface RewardRedemptionCreationAttributes extends Optional<RewardRedemptionAttributes, 'redemption_id' | 'redeemed_at' | 'status' | 'approved_by' | 'approved_at'> {}

export class RewardRedemption extends Model<RewardRedemptionAttributes, RewardRedemptionCreationAttributes> implements RewardRedemptionAttributes {
  public redemption_id!: string;
  public reward_id!: string;
  public user_id!: string;
  public redeemed_at!: Date;
  public status!: RedemptionStatus;
  public approved_by!: string | null;
  public approved_at!: Date | null;

  // You might add methods here for status transitions, e.g.:
  // public approve(approverId: string): void { ... }
  // public reject(approverId: string): void { ... }
}

RewardRedemption.init(
  {
    redemption_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    reward_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint to Rewards table
      // references: {
      //   model: 'Rewards',
      //   key: 'reward_id',
      // },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint to Users table
      // references: {
      //   model: 'Users',
      //   key: 'user_id',
      // },
    },
    redeemed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'redeemed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      // Add foreign key constraint to Users table
      // references: {
      //   model: 'Users',
      //   key: 'user_id',
      // },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'reward_redemptions',
    sequelize, // passing the sequelize instance
  }
);

// Add associations here if other models are defined
// RewardRedemption.belongsTo(Reward, { foreignKey: 'reward_id', as: 'reward' });
// RewardRedemption.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// RewardRedemption.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

export default RewardRedemption;
