import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Define possible recurrence types or rules (can be expanded)
export type RecurrenceRule = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// Define the attributes of an Event
interface EventAttributes {
  event_id: string;
  family_id: string;
  title: string;
  description: string | null;
  start_time: Date;
  end_time: Date;
  assigned_to: string | null; // user_id of the assigned member
  event_category_id: string | null;
  location: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null; // e.g., 'FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20240101T000000Z'
  recurring_end_date: Date | null;
  original_event_id: string | null; // For recurring event instances, link to the original recurring event
  created_by: string; // user_id of the creator
  created_at: Date;
  updated_at: Date;
  google_event_id: string | null; // To store the ID from Google Calendar API
}

// Define the properties of an Event instance, including creation attributes
interface EventCreationAttributes extends Optional<EventAttributes, 'event_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'event_category_id' | 'location' | 'is_recurring' | 'recurrence_rule' | 'recurring_end_date' | 'original_event_id' | 'google_event_id'> {}

export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public event_id!: string;
  public family_id!: string;
  public title!: string;
  public description!: string | null;
  public start_time!: Date;
  public end_time!: Date;
  public assigned_to!: string | null;
  public event_category_id!: string | null;
  public location!: string | null;
  public is_recurring!: boolean;
  public recurrence_rule!: string | null;
  public recurring_end_date!: Date | null;
  public original_event_id!: string | null;
  public created_by!: string;
  public created_at!: Date;
  public updated_at!: Date;
  public google_event_id!: string | null;
}

Event.init(
  {
    event_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
      allowNull: false,
    },
    family_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Families table
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      // Foreign key to Users table
    },
    event_category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Foreign key to EventCategories table
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    recurrence_rule: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Stores RRULE string from iCalendar standard
    },
    recurring_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    original_event_id: {
      type: DataTypes.UUID,
      allowNull: true,
      // Foreign key referencing Event.event_id for recurring event instances
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      // Foreign key to Users table
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
    google_event_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true, // Ensure an event isn't synced multiple times from Google
    },
  },
  {
    tableName: 'events',
    sequelize,
  }
);

// Associations defined in database.ts
// Event.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });
// Event.belongsTo(User, { foreignKey: 'created_by', as: 'creatorUser' });
// Event.belongsTo(Family, { foreignKey: 'family_id', as: 'family' });
// Event.belongsTo(EventCategory, { foreignKey: 'event_category_id', as: 'category' });
// Event.belongsTo(Event, { foreignKey: 'original_event_id', as: 'originalRecurringEvent' });

export default Event;
