import { UserProfile } from './auth';

export interface EventCategory {
    categoryId: string;
    name: string;
    color: string;
    familyId: string;
}

export interface Event {
    eventId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    recurringEndDate?: string;
    originalEventId?: string;
    assignedTo?: UserProfile | null; 
    assignedToId?: string | null;
    category?: EventCategory | null;
    eventCategoryId?: string | null;
    createdBy: UserProfile; 
    createdById: string;
    familyId: string;
    createdAt?: Date;
    updatedAt?: Date;
}
