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
  // Routine Imports from the final type structure
  UserRoutineSettings,
  SleepRoutineSettings,
  WaterRoutineSettings,
  ScheduledRoutineBase,
} from '@/types';
import { FirebaseServiceError } from '@/utils/errors';

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

/**
 * Serializable version of ScheduledRoutineBase for export/import
 */
interface SerializableScheduledRoutineBase {
  scheduledTime: string;
  durationMinutes: number;
  label: string;
  icon: string;
  completed: boolean | null; // Null for Firestore, undefined locally
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
      endTime: string;
      createdAt: string;
      updatedAt: string;
    }>;
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
  routineSettings?: {
    sleep?:
      | (SerializableScheduledRoutineBase & {
          // SleepRoutineSettings extends ScheduledRoutineBase
          napSchedule: SerializableScheduledRoutineBase[] | null;
        })
      | null;
    bath?: SerializableScheduledRoutineBase[] | null;
    water?: {
      waterGoalGlasses: number;
      currentWaterGlasses: number;
      updatedAt: string;
    } | null;
    exercise?: SerializableScheduledRoutineBase[] | null;
    meals?: SerializableScheduledRoutineBase[] | null;
    teeth?: SerializableScheduledRoutineBase[] | null;
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
        if (!firestoreData.dailyProgress) {
          firestoreData.dailyProgress = {};
        }
        if (!firestoreData.routineSettings) {
          firestoreData.routineSettings = {};
        }
        return firestoreData;
      } else {
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
      dailyProgress: {},
      routineSettings: {},
    };
    await this.setUserData(userId, initialData);
    return initialData;
  }

  /**
   * Helper to serialize a Timestamp to ISO string or null
   */
  private serializeTimestamp(ts?: Timestamp | null): string | null {
    return ts ? ts.toDate().toISOString() : null;
  }

  /**
   * Helper to deserialize an ISO string to Timestamp or null
   */
  private deserializeTimestamp(dateString?: string | null): Timestamp | null {
    if (dateString === null) return null;
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
  }

  /**
   * Helper to serialize ScheduledRoutineBase array items, converting 'completed' from boolean | undefined to boolean | null.
   */
  private serializeScheduledRoutineBaseArray(
    arr?: ScheduledRoutineBase[] | null
  ): SerializableScheduledRoutineBase[] | null {
    return (
      arr?.map(item => ({
        ...item,
        updatedAt: this.serializeTimestamp(item.updatedAt)!,
        completed: item.completed === undefined ? null : item.completed, // Convert undefined to null for Firestore
      })) || null
    );
  }

  /**
   * Helper to deserialize ScheduledRoutineBase array items, converting 'completed' from boolean | null to boolean | undefined.
   */
  private deserializeScheduledRoutineBaseArray(
    arr?: SerializableScheduledRoutineBase[] | null
  ): ScheduledRoutineBase[] | null {
    return (
      arr?.map(item => ({
        ...item,
        updatedAt: this.deserializeTimestamp(item.updatedAt)!,
        completed: item.completed === null ? undefined : item.completed, // Convert null back to undefined
      })) || null
    );
  }

  /**
   * Converts AppState (with Firestore Timestamps) to SerializableAppState (with ISO strings)
   * for JSON export.
   * @param appState The AppState to serialize.
   * @returns A SerializableAppState object.
   */
  serializeForExport(appState: AppState): SerializableAppState {
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
        description: todo.description || null,
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
      routineSettings: appState.routineSettings
        ? {
            sleep: appState.routineSettings.sleep
              ? {
                  // Directly map properties from SleepRoutineSettings (which extends ScheduledRoutineBase)
                  scheduledTime: appState.routineSettings.sleep.scheduledTime,
                  durationMinutes: appState.routineSettings.sleep.durationMinutes,
                  label: appState.routineSettings.sleep.label,
                  icon: appState.routineSettings.sleep.icon,
                  completed:
                    appState.routineSettings.sleep.completed === undefined
                      ? null
                      : appState.routineSettings.sleep.completed,
                  updatedAt: this.serializeTimestamp(appState.routineSettings.sleep.updatedAt)!,
                  // SleepRoutineSettings specific: napSchedule
                  napSchedule: this.serializeScheduledRoutineBaseArray(
                    appState.routineSettings.sleep.napSchedule
                  ),
                }
              : null,
            bath: this.serializeScheduledRoutineBaseArray(appState.routineSettings.bath),
            water: appState.routineSettings.water
              ? {
                  ...appState.routineSettings.water,
                  updatedAt: this.serializeTimestamp(appState.routineSettings.water.updatedAt)!,
                }
              : null,
            exercise: this.serializeScheduledRoutineBaseArray(appState.routineSettings.exercise),
            meals: this.serializeScheduledRoutineBaseArray(appState.routineSettings.meals),
            teeth: this.serializeScheduledRoutineBaseArray(appState.routineSettings.teeth),
          }
        : null,
    };
  }

  /**
   * Converts SerializableAppState (with ISO strings) back to AppState (with Firestore Timestamps)
   * for import.
   * @param importedData The Partial SerializableAppState to deserialize.
   * @returns An AppState object.
   */
  deserializeForImport(importedData: Partial<SerializableAppState>): AppState {
    return {
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
              ...session,
              startTime: this.deserializeTimestamp(session.startTime)!,
              endTime: this.deserializeTimestamp(session.endTime)!,
              createdAt: this.deserializeTimestamp(session.createdAt)!,
              updatedAt: this.deserializeTimestamp(session.updatedAt)!,
            })),
            createdAt: this.deserializeTimestamp(dp.createdAt)!,
            updatedAt: this.deserializeTimestamp(dp.updatedAt)!,
          },
        ])
      ),
      toDoList: (importedData.toDoList || []).map(todo => ({
        ...todo,
        description: todo.description || null,
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
                  // Directly map properties from SerializableScheduledRoutineBase to SleepRoutineSettings
                  scheduledTime: importedData.routineSettings.sleep.scheduledTime,
                  durationMinutes: importedData.routineSettings.sleep.durationMinutes,
                  label: importedData.routineSettings.sleep.label,
                  icon: importedData.routineSettings.sleep.icon,
                  completed:
                    importedData.routineSettings.sleep.completed === null
                      ? undefined
                      : importedData.routineSettings.sleep.completed,
                  updatedAt: this.deserializeTimestamp(
                    importedData.routineSettings.sleep.updatedAt
                  )!,
                  // SleepRoutineSettings specific: napSchedule
                  napSchedule: this.deserializeScheduledRoutineBaseArray(
                    importedData.routineSettings.sleep.napSchedule
                  ),
                }
              : null,
            bath: this.deserializeScheduledRoutineBaseArray(importedData.routineSettings.bath),
            water: importedData.routineSettings.water
              ? {
                  ...importedData.routineSettings.water,
                  updatedAt: this.deserializeTimestamp(
                    importedData.routineSettings.water.updatedAt
                  )!,
                }
              : null,
            exercise: this.deserializeScheduledRoutineBaseArray(
              importedData.routineSettings.exercise
            ),
            meals: this.deserializeScheduledRoutineBaseArray(importedData.routineSettings.meals),
            teeth: this.deserializeScheduledRoutineBaseArray(importedData.routineSettings.teeth),
          }
        : null,
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
      const updatedList = [...(currentData[listName] || []), newItem];
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
          const newItem = { ...item, ...updates, updatedAt: now };

          if (listName === 'toDoList') {
            const todoItem = newItem as TodoItem;

            if ('description' in updates) {
              todoItem.description =
                (updates as Partial<TodoItem>).description === undefined
                  ? null
                  : (updates as Partial<TodoItem>).description;
            }

            if ('deadline' in updates) {
              todoItem.deadline =
                (updates as Partial<TodoItem>).deadline === undefined
                  ? null
                  : (updates as Partial<TodoItem>).deadline;
            }

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
            return todoItem;
          }
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
      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const updatedList = list.filter(item => item.id !== itemId);
      await updateDoc(userDocRef, { [listName]: updatedList });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to remove item from ${listName}.`, error);
    }
  }

  /**
   * Saves or updates a DailyProgress entry for a specific date.
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
      const sessionDateKey = session.startTime.toDate().toISOString().split('T')[0];
      const now = Timestamp.now();

      const sessionToSave: StopwatchSession = {
        ...session,
        createdAt: session.createdAt || now,
        updatedAt: now,
      };

      const existingDailyProgress = currentData.dailyProgress[sessionDateKey];

      let updatedDailyProgress: DailyProgress;
      if (existingDailyProgress) {
        updatedDailyProgress = {
          ...existingDailyProgress,
          stopwatchSessions: [...(existingDailyProgress.stopwatchSessions || []), sessionToSave],
          updatedAt: now,
        };
      } else {
        updatedDailyProgress = {
          date: sessionDateKey,
          satisfactionLevel: SatisfactionLevel.MEDIUM,
          progressNote: '',
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
          const newDailyProgress = { ...currentData.dailyProgress };
          delete newDailyProgress[dateKey];
          await updateDoc(userDocRef, { dailyProgress: newDailyProgress });
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
      const existingTodoList = currentData.toDoList || [];
      const now = Timestamp.now();

      const reorderedList = existingTodoList.map(item => ({
        ...item,
        order: item.order + 1,
      }));

      const newItem: TodoItem = {
        id: generateUUID(),
        text: text.trim(),
        description: null,
        order: 0,
        completed: false,
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
   * Generic function to update a specific top-level routine setting or an array of schedules/meals/sessions.
   * @param userId The ID of the current user.
   * @param settingPath The dot-separated path to the setting (e.g., 'sleep', 'water', 'bath').
   * @param data The new data to set. This can be a Partial of a setting object, or a full array for schedule types.
   * @throws FirebaseServiceError if the update fails.
   */
  async updateSpecificRoutineSetting(
    userId: string,
    settingPath: string,
    data:
      | Partial<SleepRoutineSettings>
      | Partial<WaterRoutineSettings>
      | ScheduledRoutineBase[]
      | null // Allows clearing a setting
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found for updating routine settings.');
      }
      const currentData = docSnap.data() as AppState;
      const now = Timestamp.now();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateObject: { [key: string]: any } = {}; // Needs 'any' for dynamic string paths for updateDoc
      const pathParts = settingPath.split('.');
      const topLevelKey = pathParts[0] as keyof UserRoutineSettings;

      if (!currentData.routineSettings) {
        updateObject['routineSettings'] = {};
      }

      // Handle clearing a setting (setting to null)
      if (data === null) {
        updateObject[`routineSettings.${topLevelKey}`] = null;
      } else if (Array.isArray(data)) {
        // Handle array updates for bath, exercise, meals, teeth (all are ScheduledRoutineBase[])
        const updatedArray = data.map(item => {
          const baseItem = item as ScheduledRoutineBase;
          return {
            ...item,
            updatedAt: now,
            completed: baseItem.completed === undefined ? null : baseItem.completed, // Convert undefined to null for Firestore
          };
        });
        updateObject[`routineSettings.${topLevelKey}`] = updatedArray;
      } else {
        // Handle single object updates (e.g., for 'sleep' or 'water')
        // We know 'data' is either Partial<SleepRoutineSettings> or Partial<WaterRoutineSettings>
        const currentSetting = currentData.routineSettings?.[topLevelKey]; // Can be undefined or null if not set yet

        // Create a new object to merge into, starting with current data or an empty object
        const mergedSetting: SleepRoutineSettings | WaterRoutineSettings = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(currentSetting || ({} as any)), // Cast to any to allow spreading of potentially null/undefined currentSetting
          updatedAt: now, // Always update updatedAt
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any; // Cast for the dynamic assignment loop below

        // Iterate over keys in the incoming 'data' (the partial update) to merge and handle undefined -> null
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            // Assert key is valid for SleepRoutineSettings or WaterRoutineSettings
            const val = (data as Partial<SleepRoutineSettings> & Partial<WaterRoutineSettings>)[
              key as keyof (SleepRoutineSettings | WaterRoutineSettings)
            ];

            // If the value is explicitly undefined in the partial update, set to null for Firestore.
            // Otherwise, use the provided value.
            if (val === undefined) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (mergedSetting as any)[key] = null;
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (mergedSetting as any)[key] = val;
            }
          }
        }
        updateObject[`routineSettings.${topLevelKey}`] = mergedSetting;
      }

      await updateDoc(userDocRef, updateObject);
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to update routine setting at path '${settingPath}'.`,
        error
      );
    }
  }
}

export const firebaseService = new FirebaseService();
