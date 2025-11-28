import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type AuthProvider = 'google' | 'google_calendar' | 'apple'; // Extend as needed

interface UserAuthAttributes {
  auth_id: string;
  user_id: string; // Foreign key to Users table
  provider: AuthProvider;
  provider_user_id: string; // The ID from the external provider (e.g., Google ID)
  access_token: string | null;
  refresh_token: string | null;
  expires_at: Date | null;
  scope: string | null; // Store authorized scopes
  created_at: Date;
  updated_at: Date;
}

interface UserAuthCreationAttributes extends Optional<UserAuthAttributes, 'auth_id' | 'access_token' | 'refresh_token' | 'expires_at' | 'scope' | 'created_at' | 'updated_at'> {}

export class UserAuth extends Model<UserAuthAttributes, UserAuthCreationAttributes> implements UserAuthAttributes {
  public auth_id!: string;
  public user_id!: string;
  public provider!: AuthProvider;
  public provider_user_id!: string;
  public access_token!: string | null;
  public refresh_token!: string | null;
  public expires_at!: Date | null;
  public scope!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
}

UserAuth.init(
  {
    auth_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: 'user_provider_unique_constraint', // Ensure a user has only one entry per provider
    },
    provider: {
      type: DataTypes.ENUM('google', 'google_calendar', 'apple'),
      allowNull: false,
      unique: 'user_provider_unique_constraint',
    },
    provider_user_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // Unique ID from the provider
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'user_auths',
    sequelize,
    // Add constraints if needed, e.g., ensuring user_id exists
  }
);

// Associations
// UserAuth.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default UserAuth;
