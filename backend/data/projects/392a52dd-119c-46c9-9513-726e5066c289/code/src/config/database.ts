import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import User from '../models/User';
import Task from '../models/Task';
import Reward from '../models/Reward';
import RewardRedemption from '../models/RewardRedemption';
import UserPoints from '../models/UserPoints';
import Family from '../models/Family';
import FamilyMember from '../models/FamilyMember';
import Event from '../models/Event';
import UserAuth from '../models/UserAuth';

dotenva.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'familyflow';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: console.log, // Log SQL queries to console, disable in production if needed
  pool: {
    max: 5, // Max number of connections in pool
    min: 0, // Min number of connections in pool
    acquire: 30000, // How long to wait for a connection if pool is full
    idle: 10000, // How long a connection can be idle before being released
  },
  // Add SSL options if connecting to a cloud database like AWS RDS with SSL enabled
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false // Adjust based on your SSL certificate setup
  //   }
  // },
});

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Define associations and sync models
    // User Associations
    User.hasMany(FamilyMember, { foreignKey: 'member_id', as: 'familyMembers' });
    User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
    User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
    User.hasMany(Reward, { foreignKey: 'created_by', as: 'createdRewards' });
    User.hasMany(RewardRedemption, { foreignKey: 'user_id', as: 'redemptions' });
    User.hasMany(RewardRedemption, { foreignKey: 'approved_by', as: 'approvedRedemptions' });
    User.hasOne(UserPoints, { foreignKey: 'user_id', as: 'points' });
    User.belongsTo(User, { foreignKey: 'parent_id', as: 'parent' }); // Self-referencing for parent_id
    User.hasMany(User, { foreignKey: 'parent_id', as: 'children' }); // Self-referencing for children
    User.belongsTo(Family, { foreignKey: 'family_id', as: 'family' }); // Direct link to family if needed on User model
    User.hasMany(UserAuth, { foreignKey: 'user_id', as: 'auths' });

    // Family Associations
    Family.hasMany(FamilyMember, { foreignKey: 'family_id', as: 'members' });
    Family.hasMany(Reward, { foreignKey: 'family_id', as: 'rewards' });
    Family.hasMany(Task, { foreignKey: 'family_id', as: 'tasks' });
    Family.hasMany(Event, { foreignKey: 'family_id', as: 'events' });

    // FamilyMember Associations
    FamilyMember.belongsTo(User, { foreignKey: 'member_id', as: 'member' });
    FamilyMember.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });

    // Reward Associations
    Reward.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });
    Reward.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
    Reward.hasMany(RewardRedemption, { foreignKey: 'reward_id', as: 'redemptions' });

    // RewardRedemption Associations
    RewardRedemption.belongsTo(Reward, { foreignKey: 'reward_id', as: 'reward' });
    RewardRedemption.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    RewardRedemption.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

    // UserPoints Associations
    UserPoints.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Event Associations
    Event.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });
    Event.belongsTo(User, { foreignKey: 'created_by', as: 'creatorUser' });
    Event.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });
    // Event.belongsTo(EventCategory, { foreignKey: 'event_category_id', as: 'category' });
    // Event.belongsTo(Event, { foreignKey: 'original_event_id', as: 'originalRecurringEvent' });

    // UserAuth Associations
    UserAuth.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Sync database tables - force: true will drop and recreate tables (use with caution!)
    // In production, use migrations instead of force: true.
    await sequelize.sync({ alter: true }); // alter: true attempts to modify existing tables to match models
    console.log('All models were synchronized successfully.');

  } catch (error) {
    console.error('Unable to connect to the database or sync models:', error);
    process.exit(1); // Exit process on critical DB error
  }
};

export { initializeDatabase };
