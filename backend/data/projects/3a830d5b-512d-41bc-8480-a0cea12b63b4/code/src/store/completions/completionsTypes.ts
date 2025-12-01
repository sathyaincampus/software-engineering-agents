import { Timestamp } from 'firebase/firestore';

// Represents a single completion record for a habit on a specific date
export interface CompletionRecord {
  completionId?: string; // Firestore document ID
  userId: string;
  habitId: string;
  completionDate: string; // Format: 'yyyy-MM-dd'
  recordedAt: Timestamp;
}

// Structure to hold completion status, keyed by habit ID and then date
export interface CompletionStatusMap {
  [habitId: string]: {
    [date: string]: boolean;
  };
}
