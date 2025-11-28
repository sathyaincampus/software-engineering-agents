import { UUID } from './common';

export interface Task {
  task_id: UUID;
  family_id: UUID;
  title: string;
  description: string | null;
  assigned_to: UUID;
  due_date: string | null;
  points: number;
  status: 'pending' | 'completed' | 'in_progress';
  created_by: UUID;
  created_at: string;
  updated_at: string;
  task_category_id: UUID | null; // Link to custom task category
}

export interface TaskCreate extends Omit<Task, 'task_id' | 'created_at' | 'updated_at' | 'status' | 'assigned_to' | 'created_by' | 'family_id'> {
    assigned_to: UUID;
    created_by: UUID;
    family_id: UUID;
    task_category_id: UUID | null;
}

export interface TaskUpdate extends Partial<TaskCreate> {
    status?: 'pending' | 'completed' | 'in_progress';
}
