import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, Timestamp, writeBatch, orderBy } from 'firebase/firestore';
import { db } from './config';
import { format, startOfDay, subDays } from 'date-fns';

const COLLECTION_HABITS = 'habits';
const COLLECTION_COMPLETIONS = 'habitCompletions';

// Helper to get current user ID (replace with actual auth logic)
// In a real app, get this from your authentication state (e.g., Redux, Firebase Auth)
const getCurrentUserId = (): string | null => {
  // Example: return firebase.auth().currentUser?.uid;
  // This is a placeholder and must be implemented based on your auth setup.
  return 'placeholderUserId123';
};

/**
 * Logs a habit completion in Firestore.
 * @param habitId The ID of the habit to mark as completed.
 * @param completionDate The date of completion (defaults to today).
 * @returns Promise<void>
 */
export const logHabitCompletion = async (habitId: string, completionDate: Date = new Date()): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated.');
  }

  const dateString = format(startOfDay(completionDate), 'yyyy-MM-dd');
  const recordedAt = Timestamp.now();

  const completionRef = doc(collection(db, COLLECTION_COMPLETIONS));

  try {
    // Use a batch to ensure atomicity if we were to update streak here as well
    const batch = writeBatch(db);

    // Add the completion record
    batch.set(completionRef, {
      userId: userId,
      habitId: habitId,
      completionDate: dateString,
      recordedAt: recordedAt,
    });

    // --- Streak Update Logic --- 
    // NOTE: For robust streak calculation and to avoid race conditions/client-side errors,
    // it's highly recommended to handle streak updates via Cloud Functions triggered by Firestore writes.
    // The following is a client-side *simulation* for demonstration purposes.
    // In a production app, you'd likely have a 'streak' field on the 'habits' document itself, updated by a function.

    const habitRef = doc(db, COLLECTION_HABITS, habitId);
    // Fetch current habit data to calculate new streak (inefficient client-side)
    const habitDoc = await getDocs(query(collection(db, COLLECTION_HABITS), where('habitId', '==', habitId)));
    if (!habitDoc.empty) {
        const habitData = habitDoc.docs[0].data() as any;
        const currentStreak = habitData.streak || 0;
        // This simple increment assumes daily completion. More complex logic is needed for other frequencies.
        batch.update(habitRef, {
            streak: currentStreak + 1,
            // Optional: update lastCompletionDate if needed
            // lastCompletionDate: dateString
        });
    }

    await batch.commit();
    console.log(`Habit ${habitId} completed on ${dateString}`);
  } catch (error) {
    console.error('Error logging habit completion:', error);
    throw error;
  }
};

/**
 * Removes a habit completion record from Firestore.
 * @param habitId The ID of the habit to un-mark.
 * @param completionDate The date of completion to remove (defaults to today).
 * @returns Promise<void>
 */
export const unmarkHabitCompletion = async (habitId: string, completionDate: Date = new Date()): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated.');
  }

  const dateString = format(startOfDay(completionDate), 'yyyy-MM-dd');

  try {
    // Find the completion record for the specified habit and date
    const completionsRef = collection(db, COLLECTION_COMPLETIONS);
    const q = query(
      completionsRef,
      where('userId', '==', userId),
      where('habitId', '==', habitId),
      where('completionDate', '==', dateString)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No completion record found for habit ${habitId} on ${dateString}.`);
      // If no completion record, maybe we need to adjust streak downwards if it was falsely incremented.
      // This again highlights the need for server-side streak management.
      return;
    }

    const completionDocId = querySnapshot.docs[0].id;
    const completionRef = doc(db, COLLECTION_COMPLETIONS, completionDocId);

    // Use a batch for atomicity
    const batch = writeBatch(db);
    batch.delete(completionRef);

    // --- Streak Adjustment Logic --- 
    // Similar to logging, streak adjustment is best handled server-side.
    // Client-side: Find the habit and decrement its streak.
    const habitRef = doc(db, COLLECTION_HABITS, habitId);
    // Fetch current habit data
    const habitDoc = await getDocs(query(collection(db, COLLECTION_HABITS), where('habitId', '==', habitId)));
     if (!habitDoc.empty) {
        const habitData = habitDoc.docs[0].data() as any;
        const currentStreak = habitData.streak || 0;
        batch.update(habitRef, {
            streak: Math.max(0, currentStreak - 1), // Ensure streak doesn't go below 0
        });
    }

    await batch.commit();
    console.log(`Habit ${habitId} unmarked on ${dateString}`);
  } catch (error) {
    console.error('Error unmarking habit completion:', error);
    throw error;
  }
};

/**
 * Fetches all habits for the current user, including their current completion status for today.
 * @returns Promise<Habit[]>
 */
export const getUserHabitsWithCompletionStatus = async (): Promise<any[]> => {
    const userId = getCurrentUserId();
    if (!userId) {
        throw new Error('User not authenticated.');
    }

    const today = startOfDay(new Date());
    const todayString = format(today, 'yyyy-MM-dd');

    try {
        const habitsRef = collection(db, COLLECTION_HABITS);
        // Query for habits belonging to the current user and not archived
        const q = query(
            habitsRef,
            // where('userId', '==', userId),
            // where('archived', '==', false),
            orderBy('createdAt', 'desc') // Order by creation date
        );

        const querySnapshot = await getDocs(q);
        const habitsData: any[] = [];

        // Parallel fetching of completion status for efficiency
        const completionPromises: Promise<void>[] = [];
        const habitMap = new Map<string, any>(); // Map to store habit data before adding completion status

        querySnapshot.forEach(docSnap => {
            const habit = {
                id: docSnap.id,
                ...docSnap.data(),
                isCompletedToday: false, // Default value
                streak: docSnap.data().streak || 0 // Use stored streak
            };
            habitsData.push(habit);
            habitMap.set(habit.id, habit);
        });

        // Fetch today's completions for all habits in parallel
        const completionsRef = collection(db, COLLECTION_COMPLETIONS);
        const completionQuery = query(
            completionsRef,
            where('userId', '==', userId),
            where('completionDate', '==', todayString)
        );
        const completionSnapshot = await getDocs(completionQuery);

        completionSnapshot.forEach(completionDoc => {
            const completionData = completionDoc.data() as any;
            const habitId = completionData.habitId;
            const habit = habitMap.get(habitId);
            if (habit) {
                habit.isCompletedToday = true;
            }
        });

        return habitsData;
    } catch (error) {
        console.error('Error fetching habits with completion status:', error);
        throw error;
    }
};

// --- Cloud Function Recommendations --- 
// For production, implement the following as Cloud Functions:
// 1. updateStreakOnCompletion(habitId, userId): 
//    - Triggered by adding/deleting a document in 'habitCompletions'.
//    - Calculates and updates the 'streak' field in the 'habits' collection.
//    - Handles logic for daily, weekly, etc. frequencies.
// 2. calculateLongestStreak(habitId, userId): 
//    - A more complex function to calculate the longest streak, potentially run periodically or on demand.
// 3. checkDailyCompletionStatus(userId):
//    - Run daily to reset 'isCompletedToday' flags for the new day and potentially recalculate streaks if not done incrementally.
