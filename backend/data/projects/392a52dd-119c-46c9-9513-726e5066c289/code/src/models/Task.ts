import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Define possible statuses for a task
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// Define the attributes of a Task
interface TaskAttributes {
  task_id: string;
  family_id: string;
  title: string;
  description: string | null;
  assigned_to: string; // user_id of the child
  due_date: string; // ISO format date string YYYY-MM-DD
  points: number;
  status: TaskStatus;
  created_by: string; // user_id of the parent who created it
  created_at: Date;
  updated_at: Date;
}

// Define the properties of a Task instance, including creation attributes
interface TaskCreationAttributes extends Optional<TaskAttributes, 'task_id' | 'status' | 'created_at' | 'updated_at'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public task_id!: string;
  public family_id!: string;
  public title!: string;
  public description!: string | null;
  public assigned_to!: string;
  public due_date!: string;
  public points!: number;
  public status!: TaskStatus;
  public created_by!: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Task.init(
  {
    task_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    family_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint if Family model is defined
      // references: {
      //   model: 'Families',
      //   key: 'family_id',
      // },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint to Users table
      // references: {
      //   model: 'Users',
      //   key: 'user_id',
      // },
    },
    due_date: {
      type: DataTypes.DATEONLY, // Store only the date part
      allowNull: true,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      // Add foreign key constraint to Users table
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
    tableName: 'tasks',
    sequelize, // passing the sequelize instance
  }
);

// Add associations here if other models are defined
// Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
// Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
// Task.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });

export default Task;
