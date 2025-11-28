import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import UserPoints from './UserPoints';
import FamilyMember from './FamilyMember';
import Family from './Family';
import UserAuth from './UserAuth';

// Define possible roles for users
export type UserRole = 'parent' | 'child';

// Define the attributes of a User
interface UserAttributes {
  user_id: string;
  email: string;
  password_hash: string | null; // Nullable for OAuth users
  google_id: string | null; // Nullable for email/password users
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  parent_id: string | null; // For child-to-parent relationship
  family_id: string | null; // Direct FK to family, if used
  created_at: Date;
  updated_at: Date;
}

// Define the properties of a User instance, including creation attributes
interface UserCreationAttributes extends Optional<UserAttributes, 'user_id' | 'password_hash' | 'google_id' | 'avatar_url' | 'parent_id' | 'family_id' | 'created_at' | 'updated_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public user_id!: string;
  public email!: string;
  public password_hash!: string | null;
  public google_id!: string | null;
  public display_name!: string;
  public avatar_url!: string | null;
  public role!: UserRole;
  public parent_id!: string | null;
  public family_id!: string | null;
  public created_at!: Date;
  public updated_at!: Date;

  // Method to check if user is a parent
  public isParent(): boolean {
    return this.role === 'parent';
  }

  // Method to check if user is a child
  public isChild(): boolean {
    return this.role === 'child';
  }
}

User.init(
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable if using only Google Sign-In primarily
      unique: true,
      // Add validation for email format if needed
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for OAuth users
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for non-OAuth users
      unique: true,
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('parent', 'child'),
      allowNull: false,
      defaultValue: 'child',
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Add foreign key constraint referencing User.user_id for self-association
      // references: {
      //   model: 'Users',
      //   key: 'user_id',
      // },
    },
    family_id: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if user is not yet assigned to a family
      // Add foreign key constraint if Family model is defined
      // references: {
      //   model: 'Families',
      //   key: 'family_id',
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
    tableName: 'users',
    sequelize, // passing the sequelize instance
    hooks: {
      // Hash password before saving if it's a new password being set
      beforeSave: async (user) => {
        if (user.changed('password_hash') && user.password_hash) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
  }
);

// Define associations after all models are initialized
// Note: Associations are better defined in the database config or a separate associations file
// to avoid circular dependencies if models reference each other directly here.
// For simplicity, basic associations are commented out here and handled in database.ts.

// User.hasMany(FamilyMember, { foreignKey: 'member_id', as: 'familyMembers' });
// User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
// User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
// User.hasMany(Reward, { foreignKey: 'created_by', as: 'createdRewards' });
// User.hasMany(RewardRedemption, { foreignKey: 'user_id', as: 'redemptions' });
// User.hasMany(RewardRedemption, { foreignKey: 'approved_by', as: 'approvedRedemptions' });
// User.hasOne(UserPoints, { foreignKey: 'user_id', as: 'points' });
// User.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' });
// User.hasMany(User, { foreignKey: 'parent_id', as: 'children' });
// User.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });
// User.hasMany(UserAuth, { foreignKey: 'user_id', as: 'auths' });

export default User;
