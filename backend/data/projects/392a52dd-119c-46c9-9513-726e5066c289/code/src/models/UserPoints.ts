import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the attributes of UserPoints
interface UserPointsAttributes {
  user_id: string; // This will be a foreign key to the Users table
  current_points: number;
}

// Define the properties of a UserPoints instance, including creation attributes
interface UserPointsCreationAttributes extends Optional<UserPointsAttributes, 'current_points'> {}

export class UserPoints extends Model<UserPointsAttributes, UserPointsCreationAttributes> implements UserPointsAttributes {
  public user_id!: string;
  public current_points!: number;

  // Method to add points
  public async addPoints(pointsToAdd: number): Promise<void> {
    if (pointsToAdd > 0) {
      this.current_points += pointsToAdd;
      await this.save();
    }
  }

  // Method to deduct points
  public async deductPoints(pointsToDeduct: number): Promise<boolean> {
    if (pointsToDeduct > 0) {
      if (this.current_points >= pointsToDeduct) {
        this.current_points -= pointsToDeduct;
        await this.save();
        return true; // Deduction successful
      }
      return false; // Insufficient points
    }
    return true; // No points to deduct, consider it successful
  }
}

UserPoints.init(
  {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      // Add foreign key constraint to Users table
      // references: {
      //   model: 'Users',
      //   key: 'user_id',
      // },
    },
    current_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'user_points',
    sequelize, // passing the sequelize instance
    timestamps: false, // We don't need createdAt and updatedAt for this table as per schema
  }
);

// Add associations here if other models are defined
// UserPoints.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default UserPoints;
