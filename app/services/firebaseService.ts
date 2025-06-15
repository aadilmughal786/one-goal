// app/services/firebaseService.ts

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  AppState,
  Goal,
  ListItem,
  TodoItem,
  DailyProgress,
  SatisfactionLevel,
  StopwatchSession,
  // PriorityLevel removed
} from '@/types'; // Removed PriorityLevel import
import { FirebaseServiceError } from '@/utils/errors';

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

/**
 * Defines the serializable structure of AppState for import/export operations.
 * All Timestamp objects are converted to ISO 8601 strings.
 * DailyProgress is an array for easier JSON serialization/deserialization.
 */
interface SerializableAppState {
  goal: {
    name: string;
    description: string; // Now mandatory
    endDate: string; // ISO string
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
  } | null;
  dailyProgress: Array<{
    date: string; // "YYYY-MM-DD"
    satisfactionLevel: SatisfactionLevel;
    progressNote: string;
    stopwatchSessions: Array<{
      startTime: string; // ISO string
      label: string;
      endTime: string; // ISO string
      createdAt: string; // ISO string
      updatedAt: string; // ISO string
    }>;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
  }>;
  toDoList: Array<{
    id: string; // string UUID
    text: string;
    description: string | null; // Optional detailed description for the task
    order: number;
    completed: boolean;
    completedAt: string | null; // ISO string (optional), explicitly null for Firestore
    deadline: string | null; // ISO string (optional), explicitly null for Firestore
    // priority: PriorityLevel | null; // Priority field removed
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
  }>;
  notToDoList: Array<{
    id: string; // string UUID
    text: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
  }>;
  contextList: Array<{
    id: string; // string UUID
    text: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
  }>;
}

class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  /**
   * Subscribes to Firebase authentication state changes.
   * @param callback Function to call when auth state changes.
   * @returns An unsubscribe function.
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Signs in a user with Google.
   * @returns The authenticated Firebase User.
   * @throws FirebaseServiceError if sign-in fails.
   */
  async signInWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign in with Google.', error);
    }
  }

  /**
   * Signs out the current user.
   * @throws FirebaseServiceError if sign-out fails.
   */
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign out.', error);
    }
  }

  /**
   * Fetches user-specific application data from Firestore.
   * Initializes default data if no existing data is found.
   * @param userId The ID of the current user.
   * @returns The user's application state (AppState).
   * @throws FirebaseServiceError if data loading fails.
   */
  async getUserData(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as AppState;
        // Ensure dailyProgress is a record, handling potential empty/old formats
        if (!firestoreData.dailyProgress) {
          firestoreData.dailyProgress = {};
        }
        // No longer 'fill missing progress' here directly as it's a map.
        // UI components should handle displaying empty days based on goal range.
        return firestoreData;
      } else {
        // If no document exists, reset and return initial data
        return this.resetUserData(userId);
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to load user data for ID: ${userId}.`, error);
    }
  }

  /**
   * Sets or overwrites the entire user application state in Firestore.
   * @param userId The ID of the current user.
   * @param dataToSet The AppState object to save.
   * @throws FirebaseServiceError if data saving fails.
   */
  async setUserData(userId: string, dataToSet: AppState): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await setDoc(userDocRef, dataToSet);
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to set user data for ID: ${userId}.`, error);
    }
  }

  /**
   * Resets all user-specific data in Firestore to an initial empty state.
   * @param userId The ID of the current user.
   * @returns The initial AppState.
   * @throws FirebaseServiceError if data reset fails.
   */
  async resetUserData(userId: string): Promise<AppState> {
    const initialData: AppState = {
      goal: null,
      notToDoList: [],
      contextList: [],
      toDoList: [],
      dailyProgress: {}, // Initialize as an empty record
    };
    await this.setUserData(userId, initialData);
    return initialData;
  }

  /**
   * Converts AppState (with Firestore Timestamps) to SerializableAppState (with ISO strings)
   * for JSON export.
   * @param appState The AppState to serialize.
   * @returns A SerializableAppState object.
   */
  serializeForExport(appState: AppState): SerializableAppState {
    const serializeTimestamp = (ts?: Timestamp | null): string | null => {
      return ts ? ts.toDate().toISOString() : null;
    };

    return {
      goal: appState.goal
        ? {
            ...appState.goal,
            endDate: appState.goal.endDate.toDate().toISOString(),
            createdAt: appState.goal.createdAt.toDate().toISOString(),
            updatedAt: appState.goal.updatedAt.toDate().toISOString(),
          }
        : null,
      dailyProgress: Object.values(appState.dailyProgress).map(dp => ({
        ...dp,
        stopwatchSessions: dp.stopwatchSessions.map(session => ({
          ...session,
          startTime: session.startTime.toDate().toISOString(),
          endTime: session.endTime.toDate().toISOString(),
          createdAt: session.createdAt.toDate().toISOString(),
          updatedAt: session.updatedAt.toDate().toISOString(),
        })),
        createdAt: dp.createdAt.toDate().toISOString(),
        updatedAt: dp.updatedAt.toDate().toISOString(),
      })),
      toDoList: appState.toDoList.map(todo => ({
        ...todo,
        description: todo.description || null, // Ensure null instead of undefined for Firestore
        completedAt: serializeTimestamp(todo.completedAt),
        deadline: serializeTimestamp(todo.deadline),
        // priority: todo.priority || null, // Priority field removed
        createdAt: todo.createdAt.toDate().toISOString(),
        updatedAt: todo.updatedAt.toDate().toISOString(),
      })),
      notToDoList: appState.notToDoList.map(item => ({
        ...item,
        createdAt: item.createdAt.toDate().toISOString(),
        updatedAt: item.updatedAt.toDate().toISOString(),
      })),
      contextList: appState.contextList.map(item => ({
        ...item,
        createdAt: item.createdAt.toDate().toISOString(),
        updatedAt: item.updatedAt.toDate().toISOString(),
      })),
    };
  }

  /**
   * Converts SerializableAppState (with ISO strings) back to AppState (with Firestore Timestamps)
   * for import.
   * @param importedData The SerializableAppState to deserialize.
   * @returns An AppState object.
   */
  deserializeForImport(importedData: Partial<SerializableAppState>): AppState {
    const safeToTimestamp = (dateString?: string | null): Timestamp | null => {
      if (dateString === null) return null; // Explicitly handle null
      if (!dateString) return null; // Default to null if undefined/empty string
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : Timestamp.fromDate(date); // Return null for invalid dates
    };

    // Convert dailyProgress array back to a record
    const deserializedDailyProgress: Record<string, DailyProgress> = {};
    (importedData.dailyProgress || []).forEach(dp => {
      deserializedDailyProgress[dp.date] = {
        ...dp,
        stopwatchSessions: dp.stopwatchSessions.map(session => ({
          ...session,
          startTime: safeToTimestamp(session.startTime)!, // Assume startTime is always valid
          endTime: safeToTimestamp(session.endTime)!, // Assume endTime is always valid
          createdAt: safeToTimestamp(session.createdAt)!,
          updatedAt: safeToTimestamp(session.updatedAt)!,
        })),
        createdAt: safeToTimestamp(dp.createdAt)!,
        updatedAt: safeToTimestamp(dp.updatedAt)!,
      };
    });

    return {
      goal: importedData.goal
        ? {
            ...importedData.goal,
            endDate: safeToTimestamp(importedData.goal.endDate)!,
            createdAt: safeToTimestamp(importedData.goal.createdAt)!,
            updatedAt: safeToTimestamp(importedData.goal.updatedAt)!,
          }
        : null,
      dailyProgress: deserializedDailyProgress,
      toDoList: (importedData.toDoList || []).map(todo => ({
        ...todo,
        description: todo.description || null, // Ensure null instead of undefined
        completedAt: safeToTimestamp(todo.completedAt),
        deadline: safeToTimestamp(todo.deadline),
        // priority: todo.priority || null, // Priority field removed
        createdAt: safeToTimestamp(todo.createdAt)!,
        updatedAt: safeToTimestamp(todo.updatedAt)!,
      })),
      notToDoList: (importedData.notToDoList || []).map(item => ({
        ...item,
        createdAt: safeToTimestamp(item.createdAt)!,
        updatedAt: safeToTimestamp(item.updatedAt)!,
      })),
      contextList: (importedData.contextList || []).map(item => ({
        ...item,
        createdAt: safeToTimestamp(item.createdAt)!,
        updatedAt: safeToTimestamp(item.updatedAt)!,
      })),
    };
  }

  /**
   * Updates the user's primary goal.
   * @param userId The ID of the current user.
   * @param goal The new Goal object (or null to remove the goal).
   * @throws FirebaseServiceError if goal update fails.
   */
  async updateGoal(userId: string, goal: Goal | null): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      // Ensure timestamps are correctly set for new/updated goals
      const now = Timestamp.now();
      const goalToSave = goal
        ? {
            ...goal,
            createdAt: goal.createdAt || now, // Preserve existing or set new
            updatedAt: now,
          }
        : null;
      await updateDoc(userDocRef, { goal: goalToSave });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update goal for user ID: ${userId}.`, error);
    }
  }

  /**
   * Adds a new item to either notToDoList or contextList.
   * This now fetches the existing list, adds the new item, and updates the entire list.
   * This is necessary to correctly handle auto-generated IDs and timestamps.
   * @param userId The ID of the current user.
   * @param listName The name of the list ('notToDoList' or 'contextList').
   * @param text The text content of the new item.
   * @returns The newly added ListItem.
   * @throws FirebaseServiceError if item addition fails.
   */
  async addItemToList(
    userId: string,
    listName: 'notToDoList' | 'contextList',
    text: string
  ): Promise<ListItem> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for adding item to list.');
      }
      const currentData = docSnap.data() as AppState;
      const now = Timestamp.now();
      const newItem: ListItem = {
        id: generateUUID(),
        text: text.trim(),
        createdAt: now,
        updatedAt: now,
      };
      const updatedList = [...(currentData[listName] || []), newItem];
      await updateDoc(userDocRef, { [listName]: updatedList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to add item to ${listName}.`, error);
    }
  }

  /**
   * Updates an existing item in any list (notToDoList, contextList, or toDoList).
   * Fetches the current list, finds and updates the item, then saves the whole list back.
   * @param userId The ID of the current user.
   * @param listName The name of the list.
   * @param itemId The ID of the item to update (now string).
   * @param updates Partial updates for the item.
   * @throws FirebaseServiceError if update fails.
   */
  async updateItemInList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: string,
    updates: Partial<ListItem | TodoItem>
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for updating item in list.');
      }
      const currentData = docSnap.data() as AppState;
      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const now = Timestamp.now();

      const updatedList = list.map(item => {
        if (item.id === itemId) {
          // Create a new item object, preserving existing properties, and applying basic updates
          const newItem = { ...item, ...updates, updatedAt: now };

          // Handle specific fields that can be `undefined` from UI but must be `null` in Firestore
          if (listName === 'toDoList') {
            const todoItem = newItem as TodoItem; // Cast for specific properties

            // Convert description: if `undefined` from updates, set to `null`
            if ('description' in updates) {
              todoItem.description =
                (updates as Partial<TodoItem>).description === undefined
                  ? null
                  : (updates as Partial<TodoItem>).description;
            }

            // Convert deadline: if `undefined` from updates, set to `null`
            if ('deadline' in updates) {
              todoItem.deadline =
                (updates as Partial<TodoItem>).deadline === undefined
                  ? null
                  : (updates as Partial<TodoItem>).deadline;
            }
            // Priority field removed, so no longer need to handle it here.

            // Special handling for completedAt based on `completed` status
            if ('completed' in updates && (updates as Partial<TodoItem>).completed !== undefined) {
              if (
                (updates as Partial<TodoItem>).completed === true &&
                !(item as TodoItem).completed
              ) {
                todoItem.completedAt = now;
              } else if (
                (updates as Partial<TodoItem>).completed === false &&
                (item as TodoItem).completed
              ) {
                todoItem.completedAt = null;
              }
            }
            // If `completed` status is not being updated, completedAt remains as is from `item`

            return todoItem; // Return the modified TodoItem
          }

          // For ListItem, just return the merged newItem
          return newItem;
        }
        return item;
      });

      await updateDoc(userDocRef, { [listName]: updatedList });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update item in ${listName}.`, error);
    }
  }

  /**
   * Removes an item from any list.
   * Fetches the current list, filters out the item, then saves the whole list back.
   * @param userId The ID of the current user.
   * @param listName The name of the list.
   * @param itemId The ID of the item to remove (now string).
   * @throws FirebaseServiceError if removal fails.
   */
  async removeItemFromList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: string
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for removing item from list.');
      }
      const currentData = docSnap.data() as AppState;
      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const updatedList = list.filter(item => item.id !== itemId);
      await updateDoc(userDocRef, { [listName]: updatedList });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to remove item from ${listName}.`, error);
    }
  }

  /**
   * Saves or updates a DailyProgress entry for a specific date.
   * Since dailyProgress is now a Record, it updates the specific key directly.
   * @param userId The ID of the current user.
   * @param progressData The DailyProgress object to save.
   * @throws FirebaseServiceError if saving daily progress fails.
   */
  async saveDailyProgress(userId: string, progressData: DailyProgress): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for saving daily progress.');
      }
      const currentData = docSnap.data() as AppState;
      const now = Timestamp.now();

      const existingProgress = currentData.dailyProgress[progressData.date];

      // Update createdAt/updatedAt for the DailyProgress entry itself
      const updatedProgressData: DailyProgress = {
        ...progressData,
        createdAt: existingProgress?.createdAt || now,
        updatedAt: now,
      };

      await updateDoc(userDocRef, {
        [`dailyProgress.${progressData.date}`]: updatedProgressData,
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to save daily progress for user ID: ${userId} on date ${progressData.date}.`,
        error
      );
    }
  }

  /**
   * Adds a new stopwatch session to the relevant DailyProgress entry.
   * This function will find or create the DailyProgress entry for the session's date.
   * @param userId The ID of the current user.
   * @param session The StopwatchSession to add.
   * @throws FirebaseServiceError if adding stopwatch session fails.
   */
  async addStopwatchSession(userId: string, session: StopwatchSession): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for adding stopwatch session.');
      }
      const currentData = docSnap.data() as AppState;
      const sessionDateKey = session.startTime.toDate().toISOString().split('T')[0]; // "YYYY-MM-DD"
      const now = Timestamp.now();

      // Ensure createdAt and updatedAt are set for the session itself
      const sessionToSave: StopwatchSession = {
        ...session,
        createdAt: session.createdAt || now,
        updatedAt: now,
      };

      const existingDailyProgress = currentData.dailyProgress[sessionDateKey];

      let updatedDailyProgress: DailyProgress;
      if (existingDailyProgress) {
        // If DailyProgress exists, append session and update timestamps
        updatedDailyProgress = {
          ...existingDailyProgress,
          stopwatchSessions: [...(existingDailyProgress.stopwatchSessions || []), sessionToSave],
          updatedAt: now,
        };
      } else {
        // If DailyProgress does not exist, create a new one with default values
        updatedDailyProgress = {
          date: sessionDateKey,
          satisfactionLevel: SatisfactionLevel.MEDIUM, // Default satisfaction
          progressNote: '', // Empty note
          stopwatchSessions: [sessionToSave],
          createdAt: now,
          updatedAt: now,
        };
      }

      await updateDoc(userDocRef, {
        [`dailyProgress.${sessionDateKey}`]: updatedDailyProgress,
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add stopwatch session.', error);
    }
  }

  /**
   * Deletes a specific stopwatch session from a DailyProgress entry.
   * @param userId The ID of the current user.
   * @param dateKey The "YYYY-MM-DD" date of the DailyProgress entry.
   * @param sessionStartTime The startTime Timestamp of the session to delete.
   * @throws FirebaseServiceError if deletion fails.
   */
  async deleteStopwatchSession(
    userId: string,
    dateKey: string,
    sessionStartTime: Timestamp
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for deleting stopwatch session.');
      }
      const currentData = docSnap.data() as AppState;
      const existingDailyProgress = currentData.dailyProgress[dateKey];

      if (existingDailyProgress) {
        const updatedSessions = existingDailyProgress.stopwatchSessions.filter(
          session => !session.startTime.isEqual(sessionStartTime)
        );

        const now = Timestamp.now();
        const updatedDailyProgress: DailyProgress = {
          ...existingDailyProgress,
          stopwatchSessions: updatedSessions,
          updatedAt: now,
        };

        if (updatedSessions.length === 0 && updatedDailyProgress.progressNote === '') {
          // If no sessions and no notes, remove the daily progress entry entirely
          const newDailyProgress = { ...currentData.dailyProgress };
          delete newDailyProgress[dateKey];
          await updateDoc(userDocRef, { dailyProgress: newDailyProgress });
        } else {
          // Otherwise, just update the daily progress entry
          await updateDoc(userDocRef, {
            [`dailyProgress.${dateKey}`]: updatedDailyProgress,
          });
        }
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to delete stopwatch session.', error);
    }
  }

  /**
   * Overwrites the entire to-do list with a new, reordered list.
   * This is the preferred method for modifying the order or content of toDoList.
   * @param userId The UID of the current user.
   * @param newTodoList The full, reordered array of to-do items.
   * @throws FirebaseServiceError if update fails.
   */
  async updateTodoListOrder(userId: string, newTodoList: TodoItem[]): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { toDoList: newTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update to-do list order.', error);
    }
  }

  /**
   * Adds a new TodoItem to the toDoList.
   * This will place the new item at the top (order 0) and reorder existing items.
   * @param userId The ID of the current user.
   * @param text The text content of the new to-do item.
   * @returns The newly added TodoItem.
   * @throws FirebaseServiceError if item addition fails.
   */
  async addTodoItem(userId: string, text: string): Promise<TodoItem> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for adding todo item.');
      }
      const currentData = docSnap.data() as AppState;
      const existingTodoList = currentData.toDoList || [];
      const now = Timestamp.now();

      // Reorder existing items to make space for the new item at the top (order 0)
      const reorderedList = existingTodoList.map(item => ({
        ...item,
        order: item.order + 1, // Increment order of existing items
      }));

      const newItem: TodoItem = {
        id: generateUUID(),
        text: text.trim(),
        description: null, // Default to null for new items
        order: 0, // New item is at the top
        completed: false,
        createdAt: now,
        updatedAt: now,
        deadline: null, // Default to null for new items
      };

      const updatedTodoList = [newItem, ...reorderedList]; // Place new item at the beginning

      await updateDoc(userDocRef, { toDoList: updatedTodoList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add to-do item.', error);
    }
  }
}

export const firebaseService = new FirebaseService();
