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
  UserRoutineSettings,
  SleepRoutineSettings,
  WaterRoutineSettings,
  ScheduledRoutineBase,
} from '@/types';
import { FirebaseServiceError } from '@/utils/errors';
import { format, isSameDay } from 'date-fns';

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

/**
 * Serializable version of ScheduledRoutineBase for export/import.
 * Converts Timestamp to ISO string and handles 'completed' status as boolean or null.
 */
interface SerializableScheduledRoutineBase {
  scheduledTime: string;
  durationMinutes: number;
  label: string;
  icon: string;
  completed: boolean | null;
  updatedAt: string;
}

/**
 * Defines the serializable structure of AppState for import/export operations.
 * All Timestamp objects are converted to ISO 8601 strings.
 */
interface SerializableAppState {
  goal: {
    name: string;
    description: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  dailyProgress: Array<{
    date: string;
    satisfactionLevel: SatisfactionLevel;
    progressNote: string;
    stopwatchSessions: Array<{
      startTime: string;
      label: string;
      durationMs: number;
      createdAt: string;
      updatedAt: string;
    }>;
    effortTimeMinutes: number | null;
    createdAt: string;
    updatedAt: string;
  }>;
  toDoList: Array<{
    id: string;
    text: string;
    description: string | null;
    order: number;
    completed: boolean;
    completedAt: string | null;
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  notToDoList: Array<{
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }>;
  contextList: Array<{
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }>;
  routineSettings: {
    // No optional '?' here as per updated AppState
    sleep:
      | (SerializableScheduledRoutineBase & { napSchedule: SerializableScheduledRoutineBase[] })
      | null;
    bath: SerializableScheduledRoutineBase[];
    water: { waterGoalGlasses: number; currentWaterGlasses: number; updatedAt: string } | null;
    exercise: SerializableScheduledRoutineBase[];
    meals: SerializableScheduledRoutineBase[];
    teeth: SerializableScheduledRoutineBase[];
    lastDailyResetDate: string | null;
  } | null;
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
   * Initializes default data if no existing data is found, respecting new type definitions.
   * Resets daily routine completion status if a new day has started.
   * @param userId The ID of the current user.
   * @returns The user's application state (AppState).
   * @throws FirebaseServiceError if data loading fails.
   */
  async getUserData(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      let appState: AppState;

      if (docSnap.exists()) {
        appState = docSnap.data() as AppState;
        // Ensure core collections and routine settings are initialized to non-null values
        appState.dailyProgress = appState.dailyProgress || {};
        appState.toDoList = appState.toDoList || [];
        appState.notToDoList = appState.notToDoList || [];
        appState.contextList = appState.contextList || [];

        // Initialize routineSettings and its array properties to empty arrays if null/undefined
        if (!appState.routineSettings) {
          appState.routineSettings = {
            sleep: null,
            bath: [],
            water: null,
            exercise: [],
            meals: [],
            teeth: [],
            lastDailyResetDate: null,
          };
        } else {
          appState.routineSettings.bath = appState.routineSettings.bath || [];
          appState.routineSettings.exercise = appState.routineSettings.exercise || [];
          appState.routineSettings.meals = appState.routineSettings.meals || [];
          appState.routineSettings.teeth = appState.routineSettings.teeth || [];
          if (appState.routineSettings.sleep && !appState.routineSettings.sleep.napSchedule) {
            appState.routineSettings.sleep.napSchedule = [];
          }
        }
      } else {
        // If no data exists, initialize with default empty state respecting AppState types
        appState = {
          goal: null,
          dailyProgress: {},
          toDoList: [],
          notToDoList: [],
          contextList: [],
          routineSettings: {
            // Initialize with null for objects, empty arrays for lists
            sleep: null,
            bath: [],
            water: null,
            exercise: [],
            meals: [],
            teeth: [],
            lastDailyResetDate: null,
          },
        };
        await setDoc(userDocRef, appState); // Save initial state to Firestore
      }

      // --- Daily Routine Reset Logic ---
      const now = Timestamp.now();
      const lastResetDate = appState.routineSettings?.lastDailyResetDate; // Use Timestamp directly for comparison

      // Check if it's a new day since the last reset or if lastResetDate is null
      if (!lastResetDate || !isSameDay(lastResetDate.toDate(), now.toDate())) {
        let needsUpdate = false;
        // Create a deep copy of routineSettings to avoid direct mutation issues
        // Ensure that appState.routineSettings is treated as an object
        const updatedRoutineSettings: UserRoutineSettings = JSON.parse(
          JSON.stringify(
            appState.routineSettings || {
              // Fallback to empty object if routineSettings is null
              sleep: null,
              bath: [],
              water: null,
              exercise: [],
              meals: [],
              teeth: [],
              lastDailyResetDate: null,
            }
          )
        );

        // Helper to reset 'completed' status for an array of scheduled routines
        const resetScheduledRoutines = (
          routines: ScheduledRoutineBase[]
        ): ScheduledRoutineBase[] => {
          if (routines.length === 0) return [];
          const resetRoutines = routines.map(r => {
            if (r.completed) {
              needsUpdate = true; // Mark that an update is needed
              return { ...r, completed: false, updatedAt: now };
            }
            return r;
          });
          return resetRoutines;
        };

        // Reset array-based routines (bath, exercise, meals, teeth)
        updatedRoutineSettings.bath = resetScheduledRoutines(updatedRoutineSettings.bath);
        updatedRoutineSettings.exercise = resetScheduledRoutines(updatedRoutineSettings.exercise);
        updatedRoutineSettings.meals = resetScheduledRoutines(updatedRoutineSettings.meals);
        updatedRoutineSettings.teeth = resetScheduledRoutines(updatedRoutineSettings.teeth);

        // Handle sleep.napSchedule reset if sleep settings exist
        if (updatedRoutineSettings.sleep) {
          updatedRoutineSettings.sleep = {
            ...updatedRoutineSettings.sleep,
            napSchedule: resetScheduledRoutines(updatedRoutineSettings.sleep.napSchedule),
          };
        }

        // Reset currentWaterGlasses for the new day if water settings exist
        if (
          updatedRoutineSettings.water &&
          updatedRoutineSettings.water.currentWaterGlasses !== 0
        ) {
          updatedRoutineSettings.water = {
            ...updatedRoutineSettings.water,
            currentWaterGlasses: 0,
            updatedAt: now,
          };
          needsUpdate = true;
        }

        // Update the lastDailyResetDate if any routines were reset or it's the first reset today
        if (needsUpdate || !lastResetDate) {
          updatedRoutineSettings.lastDailyResetDate = now;
          appState.routineSettings = updatedRoutineSettings; // Update local state
          await updateDoc(userDocRef, { routineSettings: updatedRoutineSettings }); // Persist changes
        }
      }

      return appState; // Return the potentially updated appState
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
   * Initializes with default empty arrays/nulls as per AppState.
   * @param userId The ID of the current user.
   * @returns The initial AppState.
   * @throws FirebaseServiceError if data reset fails.
   */
  async resetUserData(userId: string): Promise<AppState> {
    const initialData: AppState = {
      goal: null,
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      contextList: [],
      routineSettings: {
        // Initialize with null for objects, empty arrays for lists
        sleep: null,
        bath: [],
        water: null,
        exercise: [],
        meals: [],
        teeth: [],
        lastDailyResetDate: null,
      },
    };
    await this.setUserData(userId, initialData);
    return initialData;
  }

  /**
   * Helper to serialize a Timestamp to ISO string or null.
   */
  private serializeTimestamp(ts: Timestamp | null): string | null {
    return ts ? ts.toDate().toISOString() : null;
  }

  /**
   * Helper to deserialize an ISO string to Timestamp or null.
   */
  private deserializeTimestamp(dateString: string | null): Timestamp | null {
    if (dateString === null) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
  }

  /**
   * Helper to serialize ScheduledRoutineBase array items, handling `completed: boolean | null`.
   */
  private serializeScheduledRoutineBaseArray(
    arr: ScheduledRoutineBase[] | null
  ): SerializableScheduledRoutineBase[] {
    // Return empty array if input is null
    if (!arr) return [];
    return arr.map(item => ({
      ...item,
      updatedAt: this.serializeTimestamp(item.updatedAt)!,
      completed: item.completed, // `completed` can be boolean or null, matches Serializable
    }));
  }

  /**
   * Helper to deserialize ScheduledRoutineBase array items, converting null to empty array for list types.
   */
  private deserializeScheduledRoutineBaseArray(
    arr: SerializableScheduledRoutineBase[] | null
  ): ScheduledRoutineBase[] {
    // Return empty array if input is null
    if (!arr) return [];
    return arr.map(item => ({
      ...item,
      updatedAt: this.deserializeTimestamp(item.updatedAt)!,
      completed: item.completed, // `completed` can be boolean or null, matches ScheduledRoutineBase
    }));
  }

  /**
   * Converts AppState (with Firestore Timestamps) to SerializableAppState (with ISO strings)
   * for JSON export.
   * @param appState The AppState to serialize.
   * @returns A SerializableAppState object.
   */
  serializeForExport(appState: AppState): SerializableAppState {
    // Ensure routineSettings is never null before accessing its properties for serialization
    const routineSettings = appState.routineSettings || {
      sleep: null,
      bath: [],
      water: null,
      exercise: [],
      meals: [],
      teeth: [],
      lastDailyResetDate: null,
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
          startTime: session.startTime.toDate().toISOString(),
          label: session.label,
          durationMs: session.durationMs,
          createdAt: session.createdAt.toDate().toISOString(),
          updatedAt: session.updatedAt.toDate().toISOString(),
        })),
        effortTimeMinutes: dp.effortTimeMinutes, // No ?? null needed as type is already number | null
        createdAt: dp.createdAt.toDate().toISOString(),
        updatedAt: dp.updatedAt.toDate().toISOString(),
      })),
      toDoList: appState.toDoList.map(todo => ({
        ...todo,
        description: todo.description,
        completedAt: this.serializeTimestamp(todo.completedAt),
        deadline: this.serializeTimestamp(todo.deadline),
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
      routineSettings: {
        // Directly use properties of routineSettings, guaranteed to be non-null
        sleep: routineSettings.sleep
          ? {
              ...routineSettings.sleep,
              napSchedule: this.serializeScheduledRoutineBaseArray(
                routineSettings.sleep.napSchedule
              ),
              completed: routineSettings.sleep.completed,
              updatedAt: this.serializeTimestamp(routineSettings.sleep.updatedAt)!,
            }
          : null,
        bath: this.serializeScheduledRoutineBaseArray(routineSettings.bath),
        water: routineSettings.water
          ? {
              ...routineSettings.water,
              updatedAt: this.serializeTimestamp(routineSettings.water.updatedAt)!,
            }
          : null,
        exercise: this.serializeScheduledRoutineBaseArray(routineSettings.exercise),
        meals: this.serializeScheduledRoutineBaseArray(routineSettings.meals),
        teeth: this.serializeScheduledRoutineBaseArray(routineSettings.teeth),
        lastDailyResetDate: this.serializeTimestamp(routineSettings.lastDailyResetDate),
      },
    };
  }

  /**
   * Converts SerializableAppState (with ISO strings) back to AppState (with Firestore Timestamps)
   * for import.
   * @param importedData The Partial SerializableAppState to deserialize.
   * @returns An AppState object.
   */
  deserializeForImport(importedData: Partial<SerializableAppState>): AppState {
    // Default empty objects/arrays for parts that might be missing in imported data
    const defaultRoutineSettings: UserRoutineSettings = {
      sleep: null,
      bath: [],
      water: null,
      exercise: [],
      meals: [],
      teeth: [],
      lastDailyResetDate: null,
    };

    const defaultAppState: AppState = {
      goal: null,
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      contextList: [],
      routineSettings: defaultRoutineSettings,
    };

    const deserialized: AppState = {
      ...defaultAppState, // Start with defaults to ensure all properties exist
      goal: importedData.goal
        ? {
            ...importedData.goal,
            endDate: this.deserializeTimestamp(importedData.goal.endDate)!,
            createdAt: this.deserializeTimestamp(importedData.goal.createdAt)!,
            updatedAt: this.deserializeTimestamp(importedData.goal.updatedAt)!,
          }
        : null,
      dailyProgress: Object.fromEntries(
        (importedData.dailyProgress || []).map(dp => [
          dp.date,
          {
            ...dp,
            stopwatchSessions: dp.stopwatchSessions.map(session => ({
              startTime: this.deserializeTimestamp(session.startTime)!,
              label: session.label,
              durationMs: session.durationMs,
              createdAt: this.deserializeTimestamp(session.createdAt)!,
              updatedAt: this.deserializeTimestamp(session.updatedAt)!,
            })),
            effortTimeMinutes: dp.effortTimeMinutes, // No ?? undefined needed as type is already number | null
            createdAt: this.deserializeTimestamp(dp.createdAt)!,
            updatedAt: this.deserializeTimestamp(dp.updatedAt)!,
          },
        ])
      ),
      toDoList: (importedData.toDoList || []).map(todo => ({
        ...todo,
        description: todo.description,
        completedAt: this.deserializeTimestamp(todo.completedAt),
        deadline: this.deserializeTimestamp(todo.deadline),
        createdAt: this.deserializeTimestamp(todo.createdAt)!,
        updatedAt: this.deserializeTimestamp(todo.updatedAt)!,
      })),
      notToDoList: (importedData.notToDoList || []).map(item => ({
        ...item,
        createdAt: this.deserializeTimestamp(item.createdAt)!,
        updatedAt: this.deserializeTimestamp(item.updatedAt)!,
      })),
      contextList: (importedData.contextList || []).map(item => ({
        ...item,
        createdAt: this.deserializeTimestamp(item.createdAt)!,
        updatedAt: this.deserializeTimestamp(item.updatedAt)!,
      })),
      routineSettings: importedData.routineSettings
        ? {
            sleep: importedData.routineSettings.sleep
              ? {
                  ...importedData.routineSettings.sleep,
                  napSchedule: this.deserializeScheduledRoutineBaseArray(
                    importedData.routineSettings.sleep.napSchedule
                  ),
                  completed: importedData.routineSettings.sleep.completed,
                  updatedAt: this.deserializeTimestamp(
                    importedData.routineSettings.sleep.updatedAt
                  )!,
                }
              : null,
            // Ensure array types default to empty array if imported data is null/undefined
            bath: this.deserializeScheduledRoutineBaseArray(importedData.routineSettings.bath),
            exercise: this.deserializeScheduledRoutineBaseArray(
              importedData.routineSettings.exercise
            ),
            meals: this.deserializeScheduledRoutineBaseArray(importedData.routineSettings.meals),
            teeth: this.deserializeScheduledRoutineBaseArray(importedData.routineSettings.teeth),

            water: importedData.routineSettings.water
              ? {
                  ...importedData.routineSettings.water,
                  updatedAt: this.deserializeTimestamp(
                    importedData.routineSettings.water.updatedAt
                  )!,
                }
              : null,
            lastDailyResetDate: this.deserializeTimestamp(
              importedData.routineSettings.lastDailyResetDate
            ),
          }
        : defaultRoutineSettings, // If routineSettings is null in import, use default
    };
    return deserialized;
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
      const now = Timestamp.now();
      const goalToSave = goal
        ? {
            ...goal,
            createdAt: goal.createdAt || now,
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
      const updatedList = [...currentData[listName], newItem]; // currentData[listName] is guaranteed non-null
      await updateDoc(userDocRef, { [listName]: updatedList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to add item to ${listName}.`, error);
    }
  }

  /**
   * Updates an existing item in any list (notToDoList, contextList, or toDoList).
   * @param userId The ID of the current user.
   * @param listName The name of the list.
   * @param itemId The ID of the item to update.
   * @param updates Partial updates for the item.
   * @throws FirebaseServiceError if update fails.
   */
  async updateItemInList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: string,
    updates: Partial<TodoItem | ListItem> // This type needs to be ListItem | TodoItem
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for updating item in list.');
      }
      const currentData = docSnap.data() as AppState;
      const list = currentData[listName] as Array<ListItem | TodoItem>; // list is guaranteed non-null

      const now = Timestamp.now();

      const updatedList = list.map(item => {
        if (item.id === itemId) {
          const newItem = { ...item, ...(updates as Partial<ListItem | TodoItem>), updatedAt: now };

          if (listName === 'toDoList') {
            const todoItem = newItem as TodoItem;

            // Ensure description and deadline are explicitly null if undefined in updates
            if ('description' in updates) {
              todoItem.description = updates.description === undefined ? null : updates.description;
            }
            if ('deadline' in updates) {
              todoItem.deadline = updates.deadline === undefined ? null : updates.deadline;
            }

            // Handle completed status updates for TodoItem
            if ('completed' in updates && updates.completed !== undefined) {
              if (updates.completed === true && !todoItem.completed) {
                todoItem.completedAt = now;
              } else if (updates.completed === false && todoItem.completed) {
                todoItem.completedAt = null;
              }
            }
            return todoItem;
          }
          return newItem; // For ListItem, just return the updated item
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
   * @param userId The ID of the current user.
   * @param listName The name of the list.
   * @param itemId The ID of the item to remove.
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
      const list = currentData[listName] as Array<ListItem | TodoItem>; // list is guaranteed non-null
      const updatedList = list.filter(item => item.id !== itemId);
      await updateDoc(userDocRef, { [listName]: updatedList });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to remove item from ${listName}.`, error);
    }
  }

  /**
   * Saves or updates a DailyProgress entry for a specific date.
   * Calculates and updates effortTimeMinutes based on stopwatch sessions.
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

      const updatedProgressData: DailyProgress = {
        ...progressData,
        createdAt: existingProgress?.createdAt || now,
        updatedAt: now,
      };

      // Recalculate effortTimeMinutes based on existing or new sessions
      const totalDurationMs = updatedProgressData.stopwatchSessions.reduce(
        (sum, s) => sum + s.durationMs,
        0
      );
      updatedProgressData.effortTimeMinutes = Math.round(totalDurationMs / (1000 * 60));

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
   * Recalculates effortTimeMinutes for that day.
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
      // Get the date key from the session's startTime
      const sessionDateKey = format(session.startTime.toDate(), 'yyyy-MM-dd');
      const now = Timestamp.now();

      const sessionToSave: StopwatchSession = {
        ...session,
        createdAt: session.createdAt || now,
        updatedAt: now,
      };

      const existingDailyProgress = currentData.dailyProgress[sessionDateKey];

      let updatedDailyProgress: DailyProgress;
      let newSessions: StopwatchSession[];

      if (existingDailyProgress) {
        newSessions = [...existingDailyProgress.stopwatchSessions, sessionToSave]; // guaranteed non-null
        updatedDailyProgress = {
          ...existingDailyProgress,
          satisfactionLevel: existingDailyProgress.satisfactionLevel, // Preserve existing satisfaction
          progressNote: existingDailyProgress.progressNote, // Preserve existing notes
          stopwatchSessions: newSessions,
          effortTimeMinutes: existingDailyProgress.effortTimeMinutes, // Preserve existing, will be recalculated
          createdAt: existingDailyProgress.createdAt, // Preserve original creation date
          updatedAt: now,
        };
      } else {
        newSessions = [sessionToSave];
        updatedDailyProgress = {
          date: sessionDateKey,
          satisfactionLevel: SatisfactionLevel.MEDIUM, // Default for new daily progress
          progressNote: '',
          stopwatchSessions: newSessions,
          effortTimeMinutes: 0, // Initialize for new daily progress, will be recalculated
          createdAt: now,
          updatedAt: now,
        };
      }

      // Calculate effortTimeMinutes from the (potentially new) list of sessions
      const totalDurationMs = newSessions.reduce((sum, s) => sum + s.durationMs, 0);
      updatedDailyProgress.effortTimeMinutes = Math.round(totalDurationMs / (1000 * 60));

      await updateDoc(userDocRef, {
        [`dailyProgress.${sessionDateKey}`]: updatedDailyProgress,
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add stopwatch session.', error);
    }
  }

  /**
   * Deletes a specific stopwatch session from a DailyProgress entry.
   * Recalculates effortTimeMinutes for that day.
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

        // Recalculate effortTimeMinutes after deletion
        const totalDurationMs = updatedSessions.reduce((sum, s) => sum + s.durationMs, 0);
        updatedDailyProgress.effortTimeMinutes = Math.round(totalDurationMs / (1000 * 60));

        // If no sessions and no notes, delete the whole daily progress entry
        // Otherwise, update the existing one
        if (updatedSessions.length === 0 && updatedDailyProgress.progressNote === '') {
          const newDailyProgressMap = { ...currentData.dailyProgress };
          delete newDailyProgressMap[dateKey];
          await updateDoc(userDocRef, { dailyProgress: newDailyProgressMap });
        } else {
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
      const existingTodoList = currentData.toDoList; // No longer `|| []` as per types
      const now = Timestamp.now();

      // Shift existing items down by one order to insert new item at the top (order 0)
      const reorderedList = existingTodoList.map(item => ({
        ...item,
        order: item.order + 1,
      }));

      const newItem: TodoItem = {
        id: generateUUID(),
        text: text.trim(),
        description: null,
        order: 0, // New item is at the top
        completed: false,
        completedAt: null, // Initialize as null as per TodoItem type
        createdAt: now,
        updatedAt: now,
        deadline: null,
      };

      const updatedTodoList = [newItem, ...reorderedList];

      await updateDoc(userDocRef, { toDoList: updatedTodoList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add to-do item.', error);
    }
  }

  /**
   * Private helper to consistently fetch, update, and save routine settings.
   * Handles initialization of routineSettings structure if it's null.
   * @param userId The ID of the current user.
   * @param updateFn A callback function that receives the `UserRoutineSettings` object (guaranteed non-null)
   * and performs the desired mutations.
   * @throws FirebaseServiceError if data operations fail.
   */
  private async _updateRoutineSettings(
    userId: string,
    updateFn: (settings: UserRoutineSettings) => void
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for updating routine settings.');
      }
      const currentData = docSnap.data() as AppState;

      // Initialize routineSettings if it's null, and ensure array properties are empty arrays.
      // This creates a mutable copy that strictly adheres to the UserRoutineSettings type.
      const updatedRoutineSettings: UserRoutineSettings = currentData.routineSettings
        ? {
            ...currentData.routineSettings,
            bath: currentData.routineSettings.bath || [],
            exercise: currentData.routineSettings.exercise || [],
            meals: currentData.routineSettings.meals || [],
            teeth: currentData.routineSettings.teeth || [],
            sleep: currentData.routineSettings.sleep
              ? {
                  ...currentData.routineSettings.sleep,
                  napSchedule: currentData.routineSettings.sleep.napSchedule || [],
                }
              : null,
          }
        : {
            sleep: null,
            bath: [],
            water: null,
            exercise: [],
            meals: [],
            teeth: [],
            lastDailyResetDate: null,
          };

      // Apply the specific update logic provided by the caller
      updateFn(updatedRoutineSettings);

      // Persist the updated routine settings back to Firestore
      await updateDoc(userDocRef, { routineSettings: updatedRoutineSettings });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update routine settings.`, error);
    }
  }

  /**
   * Updates the user's sleep routine settings.
   * @param userId The ID of the current user.
   * @param newSettings The new SleepRoutineSettings object, or null to clear it.
   * @throws FirebaseServiceError if update fails.
   */
  async updateSleepRoutineSettings(
    userId: string,
    newSettings: SleepRoutineSettings | null
  ): Promise<void> {
    const now = Timestamp.now();
    await this._updateRoutineSettings(userId, (settings: UserRoutineSettings) => {
      if (newSettings === null) {
        settings.sleep = null;
      } else {
        // Ensure napSchedule is an array if not provided in newSettings
        const finalNapSchedule = newSettings.napSchedule || [];
        settings.sleep = {
          ...newSettings,
          napSchedule: finalNapSchedule,
          updatedAt: now,
        };
      }
    });
  }

  /**
   * Updates the user's water intake routine settings.
   * @param userId The ID of the current user.
   * @param newSettings The new WaterRoutineSettings object, or null to clear it.
   * @throws FirebaseServiceError if update fails.
   */
  async updateWaterRoutineSettings(
    userId: string,
    newSettings: WaterRoutineSettings | null
  ): Promise<void> {
    const now = Timestamp.now();
    await this._updateRoutineSettings(userId, (settings: UserRoutineSettings) => {
      settings.water = newSettings ? { ...newSettings, updatedAt: now } : null;
    });
  }

  /**
   * Updates the user's bath routine schedules.
   * @param userId The ID of the current user.
   * @param schedules An array of ScheduledRoutineBase for bath times.
   * @throws FirebaseServiceError if update fails.
   */
  async updateBathRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    const now = Timestamp.now();
    await this._updateRoutineSettings(userId, (settings: UserRoutineSettings) => {
      settings.bath = schedules.map(item => ({ ...item, updatedAt: now }));
    });
  }

  /**
   * Updates the user's exercise routine schedules.
   * @param userId The ID of the current user.
   * @param schedules An array of ScheduledRoutineBase for exercise times.
   * @throws FirebaseServiceError if update fails.
   */
  async updateExerciseRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    const now = Timestamp.now();
    await this._updateRoutineSettings(userId, (settings: UserRoutineSettings) => {
      settings.exercise = schedules.map(item => ({ ...item, updatedAt: now }));
    });
  }

  /**
   * Updates the user's meal routine schedules.
   * @param userId The ID of the current user.
   * @param schedules An array of ScheduledRoutineBase for meal times.
   * @throws FirebaseServiceError if update fails.
   */
  async updateMealRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    const now = Timestamp.now();
    await this._updateRoutineSettings(userId, (settings: UserRoutineSettings) => {
      settings.meals = schedules.map(item => ({ ...item, updatedAt: now }));
    });
  }

  /**
   * Updates the user's teeth care routine schedules.
   * @param userId The ID of the current user.
   * @param schedules An array of ScheduledRoutineBase for teeth care times.
   * @throws FirebaseServiceError if update fails.
   */
  async updateTeethRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    const now = Timestamp.now();
    await this._updateRoutineSettings(userId, (settings: UserRoutineSettings) => {
      settings.teeth = schedules.map(item => ({ ...item, updatedAt: now }));
    });
  }

  // Removed the old updateSpecificRoutineSetting function
}

export const firebaseService = new FirebaseService();
