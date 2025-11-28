import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Define attributes for Family
interface FamilyAttributes {
  family_id: string;
  family_name: string;
  created_at: Date;
  updated_at: Date;
}

// Define properties for creation
interface FamilyCreationAttributes extends Optional<FamilyAttributes, 'family_id' | 'created_at' | 'updated_at'> {}

export class Family extends Model<FamilyAttributes, FamilyCreationAttributes> implements FamilyAttributes {
  public family_id!: string;
  public family_name!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Family.init(
  {
    family_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    family_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    tableName: 'families',
    sequelize,
  }
);

// Associations defined in database.ts
// Family.hasMany(FamilyMember, { foreignKey: 'family_id', as: 'members' });
// Family.hasMany(Reward, { foreignKey: 'family_id', as: 'rewards' });
// Family.hasMany(Task, { foreignKey: 'family_id', as: 'tasks' });
// Family.hasMany(Event, { foreignKey: 'family_id', as: 'events' });

export default Family;
