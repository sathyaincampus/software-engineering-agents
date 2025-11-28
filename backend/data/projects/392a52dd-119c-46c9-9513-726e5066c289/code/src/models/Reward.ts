import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Define the attributes of a Reward
interface RewardAttributes {
  reward_id: string;
  family_id: string;
  name: string;
  description: string | null;
  point_cost: number;
  requires_approval: boolean;
  created_by: string; // user_id of the parent who created it
  created_at: Date;
  updated_at: Date;
}

// Define the properties of a Reward instance, including creation attributes
interface RewardCreationAttributes extends Optional<RewardAttributes, 'reward_id' | 'created_at' | 'updated_at'> {}

export class Reward extends Model<RewardAttributes, RewardCreationAttributes> implements RewardAttributes {
  public reward_id!: string;
  public family_id!: string;
  public name!: string;
  public description!: string | null;
  public point_cost!: number;
  public requires_approval!: boolean;
  public created_by!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Method to check if a user has enough points for this reward
  public async hasSufficientPoints(userId: string, userPoints: number): Promise<boolean> {
    return userPoints >= this.point_cost;
  }
}

Reward.init(
  {
    reward_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    family_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint if users table is defined and linked
      // references: {
      //   model: 'Families', // Assuming a Families table
      //   key: 'family_id',
      // },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    point_cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    requires_approval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint if users table is defined
      // references: {
      //   model: 'Users',
      //   key: 'user_id',
      // },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: 'rewards',
    sequelize, // passing the sequelize instance
  }
);

// Add associations here if other models are defined
// Reward.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
// Reward.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });

export default Reward;
