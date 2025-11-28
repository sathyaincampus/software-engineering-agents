import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the attributes for the join table between Users and Families
interface FamilyMemberAttributes {
  family_id: string;
  member_id: string; // user_id
  role_in_family: string; // e.g., 'parent', 'child', 'guardian'
}

// Define the properties for creation
interface FamilyMemberCreationAttributes extends Optional<FamilyMemberAttributes, 'role_in_family'> {}

export class FamilyMember extends Model<FamilyMemberAttributes, FamilyMemberCreationAttributes> implements FamilyMemberAttributes {
  public family_id!: string;
  public member_id!: string;
  public role_in_family!: string;
}

FamilyMember.init(
  {
    family_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      // Foreign key constraint will be defined in associations in database.ts
    },
    member_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      // Foreign key constraint will be defined in associations in database.ts
    },
    role_in_family: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'child', // Default role if not specified
    },
  },
  {
    tableName: 'family_members',
    sequelize,
    timestamps: false, // No createdAt or updatedAt for this join table based on schema
  }
);

// Associations are typically defined in the main sequelize setup (database.ts)
// FamilyMember.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });
// FamilyMember.belongsTo(User, { foreignKey: 'member_id', as: 'member' });

export default FamilyMember;
