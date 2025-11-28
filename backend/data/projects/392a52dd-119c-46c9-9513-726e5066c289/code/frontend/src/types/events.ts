import { UUID } from './common';

export interface Event {
  event_id: UUID;
  family_id: UUID;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  assigned_to: UUID | null;
  event_category_id: UUID | null;
  location: string | null;
  created_by: UUID;
  created_at: string;
  updated_at: string;
  // Recurrence fields (optional for now)
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  recurring_end_date?: string | null;
  original_event_id?: UUID | null;
}

export interface EventCreate extends Omit<Event, 'event_id' | 'created_at' | 'updated_at' | 'assigned_to' | 'event_category_id' | 'created_by' | 'is_recurring' | 'recurrence_rule' | 'recurring_end_date' | 'original_event_id'> {
    assigned_to: UUID | null;
    event_category_id: UUID | null;
    created_by: UUID;
    family_id: UUID;
}

export interface EventUpdate extends Partial<EventCreate> {
    // Can include specific fields to update if needed, otherwise EventCreate can be used with partial application
}
