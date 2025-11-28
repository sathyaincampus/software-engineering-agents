import { UserProfile } from './auth';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'IN_PROGRESS';

export interface Task {
    taskId: string;
    title: string;
    description?: string;
    dueDate?: string | null;
    points: number;
    status: TaskStatus;
    assignedTo: UserProfile | null;
    assignedToId: string;
    createdBy: UserProfile; 
    createdById: string;
    familyId: string;
    createdAt?: Date;
    updatedAt?: Date;
}
