// app/services/firebaseService.ts

import {
  AppState,
  DailyProgress,
  DistractionItem,
  Goal,
  GoalStatus,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  ScheduledRoutineBase,
  SleepRoutineSettings,
  StickyNote,
  StickyNoteColor,
  StopwatchSession,
  TodoItem,
  UserRoutineSettings,
  WaterRoutineSettings,
} from '@/types';
import { FirebaseServiceError } from '@/utils/errors';
import { format, isSameDay } from 'date-fns';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  Firestore,
  Timestamp,
  deleteField,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

// --- Explicit Serializable interfaces for import/export ---
// These interfaces mirror your data model but convert Firebase Timestamps to ISO strings.
// They are specifically used for the manual serialization/deserialization logic below.

interface SerializableBaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface SerializableCompletable {
  completed: boolean;
  completedAt: string | null;
}

interface SerializableStopwatchSession
  extends Omit<StopwatchSession, 'startTime' | 'createdAt' | 'updatedAt'>,
    SerializableBaseEntity {
  startTime: string; // Convert Timestamp to string
}

interface SerializableDailyProgress extends Omit<DailyProgress, 'sessions'> {
  // 'date' is already string, 'routines' is Record<RoutineType, RoutineLogStatus> which is fine
  sessions: SerializableStopwatchSession[];
}

interface SerializableTodoItem
  extends Omit<TodoItem, 'createdAt' | 'completedAt' | 'deadline' | 'updatedAt'>,
    SerializableBaseEntity,
    SerializableCompletable {
  createdAt: string;
  completedAt: string | null;
  deadline: string | null;
}

interface SerializableDistractionItem
  extends Omit<DistractionItem, 'createdAt' | 'updatedAt'>,
    SerializableBaseEntity {
  createdAt: string;
}

interface SerializableStickyNote
  extends Omit<StickyNote, 'createdAt' | 'updatedAt'>,
    SerializableBaseEntity {
  createdAt: string;
}

interface SerializableScheduledRoutineBase
  extends Omit<ScheduledRoutineBase, 'createdAt' | 'completedAt' | 'updatedAt'>,
    SerializableBaseEntity,
    SerializableCompletable {
  createdAt: string;
  completedAt: string | null;
}

interface SerializableSleepRoutineSettings extends Omit<SleepRoutineSettings, 'naps'> {
  naps: SerializableScheduledRoutineBase[];
}

interface SerializableUserRoutineSettings
  extends Omit<
    UserRoutineSettings,
    'sleep' | 'bath' | 'exercise' | 'meal' | 'teeth' | 'lastRoutineResetDate' | 'water'
  > {
  sleep: SerializableSleepRoutineSettings | null;
  water: WaterRoutineSettings | null; // WaterRoutineSettings is already primitive types
  bath: SerializableScheduledRoutineBase[];
  exercise: SerializableScheduledRoutineBase[];
  meal: SerializableScheduledRoutineBase[];
  teeth: SerializableScheduledRoutineBase[];
  lastRoutineResetDate: string | null;
}

// SerializableGoal is now used for individual goal serialization/deserialization
interface SerializableGoal
  extends Omit<
      Goal,
      | 'dailyProgress'
      | 'toDoList'
      | 'notToDoList'
      | 'stickyNotes'
      | 'routineSettings'
      | 'startDate'
      | 'endDate'
      | 'createdAt'
      | 'updatedAt'
    >,
    SerializableBaseEntity {
  startDate: string;
  endDate: string;
  dailyProgress: Record<string, SerializableDailyProgress>;
  toDoList: SerializableTodoItem[];
  notToDoList: SerializableDistractionItem[];
  stickyNotes: SerializableStickyNote[];
  routineSettings: SerializableUserRoutineSettings;
  starredQuotes: number[];
}

// SerializableAppState for full app state import/export
interface SerializableAppState {
  activeGoalId: string | null;
  goals: Record<string, SerializableGoal>;
}
// --- END Explicit Serializable interfaces ---

class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    // Firebase configuration from environment variables
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize Firebase app, auth, and firestore
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  /**
   * Sets up an observer for changes in the user's authentication state.
   * @param callback A function to be called with the current User object (or null).
   * @returns An unsubscribe function to detach the listener.
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Updates the display name or photo URL of the current authenticated user.
   * @param user The Firebase User object to update.
   * @param updates An object containing displayName and/or photoURL.
   */
  async updateUserProfile(
    user: User,
    updates: { displayName?: string; photoURL?: string }
  ): Promise<void> {
    try {
      await updateProfile(user, updates);
    } catch (error: unknown) {
      // Re-throw custom FirebaseServiceError for consistent error handling
      throw new FirebaseServiceError('Failed to update user profile.', error);
    }
  }

  /**
   * Initiates the Google Sign-In pop-up flow.
   * @returns The signed-in User object, or null if sign-in fails.
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
   * Signs out the current authenticated user.
   */
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign out.', error);
    }
  }

  /**
   * Initializes the default structure for a new Goal's sub-properties.
   * This is used when creating a brand new goal.
   * @returns An object containing default values for Goal's nested properties.
   */
  private _initializeNewGoalStructure(): Omit<
    Goal,
    'id' | 'name' | 'description' | 'startDate' | 'endDate' | 'status' | 'createdAt' | 'updatedAt'
  > {
    return {
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      stickyNotes: [],
      routineSettings: {
        sleep: null,
        water: null,
        bath: [],
        exercise: [],
        meal: [], // 'meal' as per RoutineType enum
        teeth: [],
        lastRoutineResetDate: null,
      },
      starredQuotes: [], // Default to empty array of numbers (quote IDs)
    };
  }

  /**
   * Initializes the default top-level AppState structure.
   * @returns A default AppState object.
   */
  private _initializeDefaultAppState(): AppState {
    return {
      activeGoalId: null,
      goals: {},
    };
  }

  /**
   * Retrieves all user data (the entire AppState) from Firestore.
   * If the user document doesn't exist, it creates it with default state.
   * Also handles daily routine resets.
   * @param userId The ID of the user.
   * @returns A promise that resolves to the user's AppState.
   */
  async getUserData(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);

      let appState: AppState;

      if (!docSnap.exists()) {
        // If user document doesn't exist, initialize and set it
        appState = this._initializeDefaultAppState();
        await setDoc(userDocRef, appState);
      } else {
        // Fetch existing data and merge with default to ensure all fields exist
        const data = docSnap.data() as Partial<AppState>;
        appState = {
          ...this._initializeDefaultAppState(), // Ensure base structure
          ...data,
          goals: data.goals || {}, // Ensure goals map exists
        };
      }

      // Perform daily routine reset for each active goal
      const now = new Date();
      let appStateNeedsUpdate = false;
      const updatedGoalsCopy = { ...appState.goals }; // Create a mutable copy

      for (const goalId in updatedGoalsCopy) {
        // Iterate over the copy
        const goal = updatedGoalsCopy[goalId];
        // Only process active goals for routine resets
        if (goal.status === GoalStatus.ACTIVE && goal.routineSettings) {
          // Use GoalStatus enum directly
          const lastReset = goal.routineSettings.lastRoutineResetDate?.toDate();

          if (!lastReset || !isSameDay(lastReset, now)) {
            let goalNeedsUpdate = false;

            // Reset 'completed' status for all scheduled routines
            const resetSchedules = (schedules: ScheduledRoutineBase[]) =>
              schedules.map(s => {
                if (s.completed) {
                  goalNeedsUpdate = true;
                  return { ...s, completed: false, updatedAt: Timestamp.now() }; // Add updatedAt
                }
                return s;
              });

            goal.routineSettings.bath = resetSchedules(goal.routineSettings.bath);
            goal.routineSettings.exercise = resetSchedules(goal.routineSettings.exercise);
            goal.routineSettings.meal = resetSchedules(goal.routineSettings.meal);
            goal.routineSettings.teeth = resetSchedules(goal.routineSettings.teeth);

            // Reset water current if it's a new day
            if (goal.routineSettings.water && goal.routineSettings.water.current > 0) {
              goal.routineSettings.water.current = 0;
              goalNeedsUpdate = true;
            }

            if (goal.routineSettings.sleep?.naps) {
              goal.routineSettings.sleep.naps = resetSchedules(goal.routineSettings.sleep.naps);
            }

            if (goalNeedsUpdate) {
              goal.routineSettings.lastRoutineResetDate = Timestamp.fromDate(now);
              // Mark the goal itself as needing update
              updatedGoalsCopy[goalId] = { ...goal, updatedAt: Timestamp.now() }; // Update the copy
              appStateNeedsUpdate = true; // Mark top-level AppState for update
            }
          }
        }
      }

      // If any goal's routine settings were updated, save the whole AppState
      if (appStateNeedsUpdate) {
        // Update the original appState object with the modified goals
        appState.goals = updatedGoalsCopy;
        await updateDoc(userDocRef, { goals: appState.goals });
      }

      return appState;
    } catch (error) {
      throw new FirebaseServiceError(`Failed to load user data for ID: ${userId}.`, error);
    }
  }

  /**
   * Sets the active goal for the user.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to set as active, or null to clear.
   */
  async setActiveGoal(userId: string, goalId: string | null): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { activeGoalId: goalId });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to set active goal for user ID: ${userId}.`, error);
    }
  }

  /**
   * Overwrites the entire user data (AppState) in Firestore. Use with caution.
   * Prefer specific update methods.
   * @param userId The ID of the user.
   * @param dataToSet The complete AppState object to save.
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
   * Resets all user data to the initial default state.
   * @param userId The ID of the user.
   * @returns The newly reset AppState.
   */
  async resetUserData(userId: string): Promise<AppState> {
    const initialData = this._initializeDefaultAppState();
    await this.setUserData(userId, initialData);
    return initialData;
  }

  /**
   * Creates a new goal for the user.
   * @param userId The ID of the user.
   * @param newGoalData The partial goal data (name, description, dates, status).
   * @returns The newly created Goal object with ID and timestamps.
   */
  async createGoal(
    userId: string,
    newGoalData: Omit<
      Goal,
      'id' | 'createdAt' | 'updatedAt' | keyof ReturnType<typeof this._initializeNewGoalStructure>
    >
  ): Promise<Goal> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found. Please create user data first.');
      }
      const currentAppState = docSnap.data() as AppState;

      const goalId = generateUUID();
      const now = Timestamp.now();

      const newGoal: Goal = {
        id: goalId,
        createdAt: now,
        updatedAt: now,
        ...newGoalData,
        ...this._initializeNewGoalStructure(), // Add default nested structures
      };

      currentAppState.goals = {
        ...currentAppState.goals,
        [goalId]: newGoal,
      };

      await updateDoc(userDocRef, { goals: currentAppState.goals });
      return newGoal;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to create new goal.', error);
    }
  }

  /**
   * Retrieves a specific goal by its ID for a given user.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to retrieve.
   * @returns The Goal object, or null if not found.
   */
  async getGoalById(userId: string, goalId: string): Promise<Goal | null> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) return null;
      const appState = docSnap.data() as AppState;
      return appState.goals[goalId] || null;
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to get goal ${goalId}.`, error);
    }
  }

  /**
   * Updates properties of an existing goal.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to update.
   * @param updates Partial Goal object with fields to update.
   */
  async updateGoal(userId: string, goalId: string, updates: Partial<Goal>): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;

      if (!currentAppState.goals[goalId]) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for update.`);
      }

      // Update the specific goal within the goals map
      const updatedGoal = {
        ...currentAppState.goals[goalId],
        ...updates,
        updatedAt: Timestamp.now(), // Always update `updatedAt`
      };

      await updateDoc(userDocRef, { [`goals.${goalId}`]: updatedGoal });
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to update goal ${goalId} for user ID: ${userId}.`,
        error
      );
    }
  }

  /**
   * Deletes a goal from the user's data. If it was the active goal, activeGoalId is cleared.
   * @param userId The ID of the user.
   * @param goalId The ID of the goal to delete.
   */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;

      if (!currentAppState.goals[goalId]) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for deletion.`);
      }

      // Create a new goals object without the deleted goal
      const updatedGoals = { ...currentAppState.goals };
      delete updatedGoals[goalId];

      // If the deleted goal was active, clear activeGoalId
      const updates: Partial<AppState> = { goals: updatedGoals };
      if (currentAppState.activeGoalId === goalId) {
        updates.activeGoalId = null;
      }

      await updateDoc(userDocRef, updates);
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to delete goal ${goalId}.`, error);
    }
  }

  /**
   * Adds a new to-do item to a specific goal's to-do list.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param text The text content of the to-do item.
   * @returns The newly created TodoItem.
   */
  async addTodoItem(goalId: string, userId: string, text: string): Promise<TodoItem> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for adding todo item.`);
      }

      const newItem: TodoItem = {
        id: generateUUID(),
        text: text.trim(),
        description: null,
        order: 0, // New items are typically at the top
        completed: false,
        completedAt: null,
        deadline: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Add new item to the beginning and reorder existing items
      const updatedTodoList = [
        newItem,
        ...(currentGoal.toDoList || []).map(item => ({
          ...item,
          order: item.order + 1,
          updatedAt: Timestamp.now(),
        })),
      ];

      await updateDoc(userDocRef, { [`goals.${goalId}.toDoList`]: updatedTodoList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add to-do item.', error);
    }
  }

  /**
   * Updates an existing to-do item within a goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param itemId The ID of the to-do item to update.
   * @param updates Partial TodoItem object with fields to update.
   */
  async updateTodoItem(
    goalId: string,
    userId: string,
    itemId: string,
    updates: Partial<Omit<TodoItem, 'createdAt' | 'updatedAt' | 'id'>>
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for updating todo item.`);
      }

      const updatedTodoList = (currentGoal.toDoList || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates, updatedAt: Timestamp.now() };
          // Handle 'completed' status to set/clear 'completedAt'
          if ('completed' in updates) {
            updatedItem.completedAt = updates.completed ? Timestamp.now() : null;
          }
          return updatedItem;
        }
        return item;
      });

      await updateDoc(userDocRef, { [`goals.${goalId}.toDoList`]: updatedTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update to-do item.', error);
    }
  }

  /**
   * Deletes a to-do item from a specific goal's to-do list.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param itemId The ID of the to-do item to delete.
   */
  async deleteTodoItem(goalId: string, userId: string, itemId: string): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for deleting todo item.`);
      }

      const updatedTodoList = (currentGoal.toDoList || []).filter(item => item.id !== itemId);

      await updateDoc(userDocRef, { [`goals.${goalId}.toDoList`]: updatedTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to delete to-do item.', error);
    }
  }

  /**
   * Updates the order of to-do items within a goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param newTodoList The entire to-do list with updated order.
   */
  async updateTodoListOrder(
    goalId: string,
    userId: string,
    newTodoList: TodoItem[]
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      // Ensure that updatedAt is set for each item if needed, otherwise just update the array
      const updatedListWithTimestamps = newTodoList.map(item => ({
        ...item,
        updatedAt: Timestamp.now(),
      }));
      await updateDoc(userDocRef, { [`goals.${goalId}.toDoList`]: updatedListWithTimestamps });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update to-do list order.', error);
    }
  }

  /**
   * Adds a new distraction item to a specific goal's not-to-do list.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param title The title of the distraction.
   * @param description An optional description.
   * @param triggerPatterns An array of trigger patterns.
   * @returns The newly created DistractionItem.
   */
  async addDistractionItem(
    goalId: string,
    userId: string,
    title: string,
    description: string | null = null,
    triggerPatterns: string[] = []
  ): Promise<DistractionItem> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for adding distraction.`);
      }

      const newItem: DistractionItem = {
        id: generateUUID(),
        title: title.trim(),
        description: description,
        triggerPatterns: triggerPatterns,
        count: 0, // Initialize count
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const updatedNotTodoList = [...(currentGoal.notToDoList || []), newItem];

      await updateDoc(userDocRef, { [`goals.${goalId}.notToDoList`]: updatedNotTodoList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add distraction item.', error);
    }
  }

  /**
   * Updates an existing distraction item within a goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param itemId The ID of the distraction item to update.
   * @param updates Partial DistractionItem object with fields to update.
   */
  async updateDistractionItem(
    goalId: string,
    userId: string,
    itemId: string,
    updates: Partial<Omit<DistractionItem, 'createdAt' | 'updatedAt' | 'id'>>
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for updating distraction.`
        );
      }

      const updatedNotTodoList = (currentGoal.notToDoList || []).map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates, updatedAt: Timestamp.now() };
        }
        return item;
      });

      await updateDoc(userDocRef, { [`goals.${goalId}.notToDoList`]: updatedNotTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update distraction item.', error);
    }
  }

  /**
   * Deletes a distraction item from a specific goal's not-to-do list.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param itemId The ID of the distraction item to delete.
   */
  async deleteDistractionItem(goalId: string, userId: string, itemId: string): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for deleting distraction.`
        );
      }

      const updatedNotTodoList = (currentGoal.notToDoList || []).filter(item => item.id !== itemId);

      await updateDoc(userDocRef, { [`goals.${goalId}.notToDoList`]: updatedNotTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to delete distraction item.', error);
    }
  }

  /**
   * Adds a new sticky note to a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param title The title of the sticky note.
   * @param content The content of the sticky note.
   * @param color The color of the sticky note.
   * @returns The newly created StickyNote.
   */
  async addStickyNote(
    goalId: string,
    userId: string,
    title: string,
    content: string,
    color: StickyNoteColor
  ): Promise<StickyNote> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(`Goal with ID ${goalId} not found for adding sticky note.`);
      }

      const newItem: StickyNote = {
        id: generateUUID(),
        title: title.trim(),
        content: content.trim(),
        color: color,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const updatedStickyNotes = [...(currentGoal.stickyNotes || []), newItem];

      await updateDoc(userDocRef, { [`goals.${goalId}.stickyNotes`]: updatedStickyNotes });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add sticky note.', error);
    }
  }

  /**
   * Updates an existing sticky note within a goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param itemId The ID of the sticky note to update.
   * @param updates Partial StickyNote object with fields to update.
   */
  async updateStickyNote(
    goalId: string,
    userId: string,
    itemId: string,
    updates: Partial<Omit<StickyNote, 'createdAt' | 'updatedAt' | 'id'>>
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for updating sticky note.`
        );
      }

      const updatedStickyNotes = (currentGoal.stickyNotes || []).map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates, updatedAt: Timestamp.now() };
        }
        return item;
      });

      await updateDoc(userDocRef, { [`goals.${goalId}.stickyNotes`]: updatedStickyNotes });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update sticky note.', error);
    }
  }

  /**
   * Deletes a sticky note from a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param itemId The ID of the sticky note to delete.
   */
  async deleteStickyNote(goalId: string, userId: string, itemId: string): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for deleting sticky note.`
        );
      }

      const updatedStickyNotes = (currentGoal.stickyNotes || []).filter(item => item.id !== itemId);

      await updateDoc(userDocRef, { [`goals.${goalId}.stickyNotes`]: updatedStickyNotes });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to delete sticky note.', error);
    }
  }

  /**
   * Saves or updates a daily progress log for a specific goal and date.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param progressData The DailyProgress object to save.
   */
  async saveDailyProgress(
    goalId: string,
    userId: string,
    progressData: DailyProgress
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for saving daily progress.`
        );
      }

      const existingProgress = (currentGoal.dailyProgress || {})[progressData.date];

      const updatedProgressData: DailyProgress = {
        ...(existingProgress || {
          date: progressData.date,
          satisfaction: SatisfactionLevel.NEUTRAL, // Default if creating new
          notes: '', // Default if creating new
          sessions: [],
          routines: {} as Record<RoutineType, RoutineLogStatus>, // Initialize
        }),
        ...progressData,
        // Merge routines explicitly to avoid overwriting all if partial update
        routines: {
          ...(existingProgress?.routines || {}),
          ...(progressData.routines || {}),
        },
      };

      await updateDoc(userDocRef, {
        [`goals.${goalId}.dailyProgress.${progressData.date}`]: updatedProgressData,
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to save daily progress for goal ${goalId}, date ${progressData.date}.`,
        error
      );
    }
  }

  /**
   * Deletes a daily progress log for a specific goal and date.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param dateKey The date string (YYYY-MM-DD) of the progress log to delete.
   */
  async deleteDailyProgress(goalId: string, userId: string, dateKey: string): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        [`goals.${goalId}.dailyProgress.${dateKey}`]: deleteField(),
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to delete daily progress for goal ${goalId}, date ${dateKey}.`,
        error
      );
    }
  }

  /**
   * Adds a new stopwatch session to a goal's daily progress for the current date.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param session The stopwatch session data (excluding ID, createdAt, updatedAt).
   * @returns The newly created StopwatchSession including its ID and timestamps.
   */
  async addStopwatchSession(
    goalId: string,
    userId: string,
    session: Omit<StopwatchSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StopwatchSession> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for adding stopwatch session.`
        );
      }

      const sessionId = generateUUID();
      const now = Timestamp.now();
      const sessionWithMetadata: StopwatchSession = {
        ...session,
        id: sessionId,
        startTime: session.startTime || now, // Use provided startTime or current time
        createdAt: now,
        updatedAt: now,
      };
      const sessionDateKey = format(sessionWithMetadata.startTime.toDate(), 'yyyy-MM-dd');

      // Retrieve existing daily progress for the date or initialize it
      const existingDailyProgress = (currentGoal.dailyProgress || {})[sessionDateKey] || {
        date: sessionDateKey,
        satisfaction: SatisfactionLevel.NEUTRAL,
        notes: '',
        sessions: [],
        routines: {} as Record<RoutineType, RoutineLogStatus>,
      };

      const newSessions = [...(existingDailyProgress.sessions || []), sessionWithMetadata];

      const updatedDailyProgress: DailyProgress = {
        ...existingDailyProgress,
        sessions: newSessions,
      };

      await updateDoc(userDocRef, {
        [`goals.${goalId}.dailyProgress.${sessionDateKey}`]: updatedDailyProgress,
      });
      return sessionWithMetadata;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add stopwatch session.', error);
    }
  }

  /**
   * Updates an existing stopwatch session within a goal's daily progress.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param dateKey The date string (YYYY-MM-DD) of the daily progress.
   * @param sessionId The ID of the stopwatch session to update.
   * @param updates Partial StopwatchSession object with fields to update.
   */
  async updateStopwatchSession(
    goalId: string,
    userId: string,
    dateKey: string,
    sessionId: string,
    updates: Partial<StopwatchSession>
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for updating stopwatch session.`
        );
      }

      const dailyProgress = currentGoal.dailyProgress?.[dateKey];

      if (dailyProgress) {
        const updatedSessions = dailyProgress.sessions.map(session => {
          if (session.id === sessionId) {
            return { ...session, ...updates, updatedAt: Timestamp.now() };
          }
          return session;
        });

        const updatedDailyProgress: DailyProgress = {
          ...dailyProgress,
          sessions: updatedSessions,
        };

        await updateDoc(userDocRef, {
          [`goals.${goalId}.dailyProgress.${dateKey}`]: updatedDailyProgress,
        });
      } else {
        throw new FirebaseServiceError(
          `Daily progress for date ${dateKey} not found for goal ${goalId}.`
        );
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update stopwatch session.', error);
    }
  }

  /**
   * Deletes a stopwatch session from a goal's daily progress.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param dateKey The date string (YYYY-MM-DD) of the daily progress.
   * @param sessionId The ID of the stopwatch session to delete.
   */
  async deleteStopwatchSession(
    goalId: string,
    userId: string,
    dateKey: string,
    sessionId: string
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for deleting stopwatch session.`
        );
      }

      const dailyProgress = currentGoal.dailyProgress?.[dateKey];

      if (dailyProgress) {
        const updatedSessions = dailyProgress.sessions.filter(session => session.id !== sessionId);

        const updatedDailyProgress: DailyProgress = {
          ...dailyProgress,
          sessions: updatedSessions,
        };

        await updateDoc(userDocRef, {
          [`goals.${goalId}.dailyProgress.${dateKey}`]: updatedDailyProgress,
        });
      } else {
        throw new FirebaseServiceError(
          `Daily progress for date ${dateKey} not found for goal ${goalId}.`
        );
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to delete stopwatch session.', error);
    }
  }

  /**
   * Internal helper to update a specific routine setting within a goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param updateFn A function that receives the current UserRoutineSettings and modifies it.
   */
  private async _updateGoalRoutineSettings(
    goalId: string,
    userId: string,
    updateFn: (settings: UserRoutineSettings) => void
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for updating routine settings.`
        );
      }

      // Initialize routineSettings if it doesn't exist for the goal
      const settings =
        currentGoal.routineSettings || this._initializeNewGoalStructure().routineSettings;
      updateFn(settings); // Apply the specific update logic

      await updateDoc(userDocRef, { [`goals.${goalId}.routineSettings`]: settings });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update routine settings.', error);
    }
  }

  /**
   * Updates the sleep routine settings for a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param newSettings The new SleepRoutineSettings object, or null to clear.
   */
  async updateSleepRoutineSettings(
    goalId: string,
    userId: string,
    newSettings: SleepRoutineSettings | null
  ): Promise<void> {
    await this._updateGoalRoutineSettings(goalId, userId, settings => {
      settings.sleep = newSettings;
    });
  }

  /**
   * Updates the water intake routine settings for a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param newSettings The new WaterRoutineSettings object, or null to clear.
   */
  async updateWaterRoutineSettings(
    goalId: string,
    userId: string,
    newSettings: WaterRoutineSettings | null
  ): Promise<void> {
    await this._updateGoalRoutineSettings(goalId, userId, settings => {
      settings.water = newSettings;
    });
  }

  /**
   * Updates the bath routine schedules for a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param schedules An array of ScheduledRoutineBase for bath routines.
   */
  async updateBathRoutineSchedules(
    goalId: string,
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateGoalRoutineSettings(goalId, userId, settings => {
      settings.bath = schedules;
    });
  }

  /**
   * Updates the exercise routine schedules for a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param schedules An array of ScheduledRoutineBase for exercise routines.
   */
  async updateExerciseRoutineSchedules(
    goalId: string,
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateGoalRoutineSettings(goalId, userId, settings => {
      settings.exercise = schedules;
    });
  }

  /**
   * Updates the meal routine schedules for a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param schedules An array of ScheduledRoutineBase for meal routines.
   */
  async updateMealRoutineSchedules(
    goalId: string,
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateGoalRoutineSettings(goalId, userId, settings => {
      settings.meal = schedules; // 'meal' as per RoutineType enum
    });
  }

  /**
   * Updates the teeth routine schedules for a specific goal.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param schedules An array of ScheduledRoutineBase for teeth routines.
   */
  async updateTeethRoutineSchedules(
    goalId: string,
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateGoalRoutineSettings(goalId, userId, settings => {
      settings.teeth = schedules;
    });
  }

  /**
   * Adds a starred quote ID to a specific goal's list of starred quotes.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param quoteId The ID of the quote to add.
   */
  async addStarredQuote(goalId: string, userId: string, quoteId: number): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for adding starred quote.`
        );
      }

      // Ensure starredQuotes is initialized and add the new quoteId
      const updatedStarredQuotes = [...(currentGoal.starredQuotes || []), quoteId];
      await updateDoc(userDocRef, { [`goals.${goalId}.starredQuotes`]: updatedStarredQuotes });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add starred quote.', error);
    }
  }

  /**
   * Removes a starred quote ID from a specific goal's list of starred quotes.
   * @param goalId The ID of the goal.
   * @param userId The ID of the user.
   * @param quoteId The ID of the quote to remove.
   */
  async removeStarredQuote(goalId: string, userId: string, quoteId: number): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentAppState = docSnap.data() as AppState;
      const currentGoal = currentAppState.goals[goalId];

      if (!currentGoal) {
        throw new FirebaseServiceError(
          `Goal with ID ${goalId} not found for removing starred quote.`
        );
      }

      // Ensure starredQuotes is initialized and filter out the quoteId
      const updatedStarredQuotes = (currentGoal.starredQuotes || []).filter(id => id !== quoteId);
      await updateDoc(userDocRef, { [`goals.${goalId}.starredQuotes`]: updatedStarredQuotes });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to remove starred quote.', error);
    }
  }

  /**
   * Archives the current active goal by setting its status to COMPLETED
   * and clearing the activeGoalId in the AppState.
   * @param userId The ID of the user.
   * @returns A Promise resolving to the updated AppState.
   */
  async archiveCurrentGoal(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        throw new FirebaseServiceError('User data not found.', 'USER_DATA_NOT_FOUND');
      }

      const currentAppState = docSnap.data() as AppState;
      const activeGoalId = currentAppState.activeGoalId;

      if (!activeGoalId || !currentAppState.goals[activeGoalId]) {
        throw new FirebaseServiceError('No active goal to archive.', 'NO_ACTIVE_GOAL');
      }

      const activeGoal = currentAppState.goals[activeGoalId];
      const now = Timestamp.now();

      // Update the active goal's status to COMPLETED and set updatedAt timestamp
      const updatedGoal: Goal = {
        ...activeGoal,
        status: GoalStatus.COMPLETED, // Set status to COMPLETED
        updatedAt: now,
      };

      // Create a new goals object with the updated goal
      const updatedGoals = {
        ...currentAppState.goals,
        [activeGoalId]: updatedGoal,
      };

      // Create the new AppState with the updated goals and cleared activeGoalId
      const newAppState: AppState = {
        ...currentAppState,
        activeGoalId: null, // Clear active goal
        goals: updatedGoals,
      };

      // Persist the entire new AppState to Firestore
      // Using setDoc to completely overwrite the user document, ensuring full consistency.
      await setDoc(userDocRef, newAppState);

      return newAppState; // Return the updated AppState
    } catch (error: unknown) {
      const errorMessage =
        error instanceof FirebaseServiceError ? error.message : 'An unknown error occurred.';
      throw new FirebaseServiceError(
        `Failed to archive current goal: ${errorMessage}`,
        'ARCHIVE_GOAL_FAILED'
      );
    }
  }

  // --- Serialization / Deserialization methods for ENTIRE AppState (for Profile Page) ---
  private serializeTimestamp(ts: Timestamp | null | undefined): string | null {
    return ts ? ts.toDate().toISOString() : null;
  }

  private deserializeTimestamp(dateString: string | null | undefined): Timestamp | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
  }

  /**
   * Serializes the entire AppState object into a plain JavaScript object
   * with Timestamps converted to ISO date strings, suitable for export.
   * This is done with explicit, manual mapping for full type safety.
   * @param appState The AppState object to serialize.
   * @returns A SerializableAppState object.
   */
  serializeAppState(appState: AppState): SerializableAppState {
    const serializedGoals: Record<string, SerializableGoal> = {};

    for (const goalId in appState.goals) {
      const goal = appState.goals[goalId];
      serializedGoals[goalId] = {
        id: goal.id,
        createdAt: this.serializeTimestamp(goal.createdAt)!,
        updatedAt: this.serializeTimestamp(goal.updatedAt)!,
        name: goal.name,
        description: goal.description,
        startDate: this.serializeTimestamp(goal.startDate)!,
        endDate: this.serializeTimestamp(goal.endDate)!,
        status: goal.status,
        dailyProgress: Object.fromEntries(
          Object.entries(goal.dailyProgress).map(([dateKey, dp]) => [
            dateKey,
            {
              date: dp.date,
              satisfaction: dp.satisfaction,
              notes: dp.notes,
              routines: dp.routines, // Already simple types
              sessions: dp.sessions.map(s => ({
                id: s.id,
                createdAt: this.serializeTimestamp(s.createdAt)!,
                updatedAt: this.serializeTimestamp(s.updatedAt)!,
                startTime: this.serializeTimestamp(s.startTime)!,
                label: s.label,
                duration: s.duration,
              })),
            } as SerializableDailyProgress, // Explicitly cast
          ])
        ),
        toDoList: goal.toDoList.map(todo => ({
          id: todo.id,
          createdAt: this.serializeTimestamp(todo.createdAt)!,
          updatedAt: this.serializeTimestamp(todo.updatedAt)!,
          completedAt: this.serializeTimestamp(todo.completedAt),
          deadline: this.serializeTimestamp(todo.deadline),
          completed: todo.completed,
          order: todo.order,
          text: todo.text,
          description: todo.description,
        })),
        notToDoList: goal.notToDoList.map(distraction => ({
          id: distraction.id,
          createdAt: this.serializeTimestamp(distraction.createdAt)!,
          updatedAt: this.serializeTimestamp(distraction.updatedAt)!,
          title: distraction.title,
          description: distraction.description,
          triggerPatterns: distraction.triggerPatterns,
          count: distraction.count,
        })),
        stickyNotes: goal.stickyNotes.map(note => ({
          id: note.id,
          createdAt: this.serializeTimestamp(note.createdAt)!,
          updatedAt: this.serializeTimestamp(note.updatedAt)!,
          title: note.title,
          content: note.content,
          color: note.color,
        })),
        routineSettings: {
          sleep: goal.routineSettings.sleep
            ? {
                wakeTime: goal.routineSettings.sleep.wakeTime,
                sleepTime: goal.routineSettings.sleep.sleepTime,
                naps: goal.routineSettings.sleep.naps.map(nap => ({
                  id: nap.id,
                  createdAt: this.serializeTimestamp(nap.createdAt)!,
                  updatedAt: this.serializeTimestamp(nap.updatedAt)!,
                  completedAt: this.serializeTimestamp(nap.completedAt),
                  completed: nap.completed,
                  time: nap.time,
                  duration: nap.duration,
                  label: nap.label,
                  icon: nap.icon,
                })),
              }
            : null,
          water: goal.routineSettings.water, // Already primitive types
          bath: goal.routineSettings.bath.map(r => ({
            id: r.id,
            createdAt: this.serializeTimestamp(r.createdAt)!,
            updatedAt: this.serializeTimestamp(r.updatedAt)!,
            completedAt: this.serializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          exercise: goal.routineSettings.exercise.map(r => ({
            id: r.id,
            createdAt: this.serializeTimestamp(r.createdAt)!,
            updatedAt: this.serializeTimestamp(r.updatedAt)!,
            completedAt: this.serializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          meal: goal.routineSettings.meal.map(r => ({
            id: r.id,
            createdAt: this.serializeTimestamp(r.createdAt)!,
            updatedAt: this.serializeTimestamp(r.updatedAt)!,
            completedAt: this.serializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          teeth: goal.routineSettings.teeth.map(r => ({
            id: r.id,
            createdAt: this.serializeTimestamp(r.createdAt)!,
            updatedAt: this.serializeTimestamp(r.updatedAt)!,
            completedAt: this.serializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          lastRoutineResetDate: this.serializeTimestamp(goal.routineSettings.lastRoutineResetDate),
        } as SerializableUserRoutineSettings, // Explicitly cast
        starredQuotes: goal.starredQuotes, // Already simple types
      };
    }

    return {
      activeGoalId: appState.activeGoalId,
      goals: serializedGoals,
    };
  }

  /**
   * Deserializes a plain JavaScript object (from import) back into an AppState
   * object with ISO date strings converted to Firebase Timestamps.
   * This is done with explicit, manual mapping for full type safety.
   * @param serializedData The SerializableAppState object to deserialize.
   * @returns The deserialized AppState object.
   */
  deserializeAppState(serializedData: SerializableAppState): AppState {
    const deserializedGoals: Record<string, Goal> = {};

    for (const goalId in serializedData.goals) {
      const serializedGoal = serializedData.goals[goalId];
      deserializedGoals[goalId] = {
        id: serializedGoal.id,
        createdAt: this.deserializeTimestamp(serializedGoal.createdAt)!,
        updatedAt: this.deserializeTimestamp(serializedGoal.updatedAt)!,
        name: serializedGoal.name,
        description: serializedGoal.description,
        startDate: this.deserializeTimestamp(serializedGoal.startDate)!,
        endDate: this.deserializeTimestamp(serializedGoal.endDate)!,
        status: serializedGoal.status,
        dailyProgress: Object.fromEntries(
          Object.entries(serializedGoal.dailyProgress).map(([dateKey, serializedDp]) => [
            dateKey,
            {
              date: serializedDp.date,
              satisfaction: serializedDp.satisfaction,
              notes: serializedDp.notes,
              routines: serializedDp.routines,
              sessions: serializedDp.sessions.map(s => ({
                id: s.id,
                createdAt: this.deserializeTimestamp(s.createdAt)!,
                updatedAt: this.deserializeTimestamp(s.updatedAt)!,
                startTime: this.deserializeTimestamp(s.startTime)!,
                label: s.label,
                duration: s.duration,
              })),
            } as DailyProgress, // Explicitly cast
          ])
        ),
        toDoList: serializedGoal.toDoList.map(serializedTodo => ({
          id: serializedTodo.id,
          createdAt: this.deserializeTimestamp(serializedTodo.createdAt)!,
          updatedAt: this.deserializeTimestamp(serializedTodo.updatedAt)!,
          completedAt: this.deserializeTimestamp(serializedTodo.completedAt),
          deadline: this.deserializeTimestamp(serializedTodo.deadline),
          completed: serializedTodo.completed,
          order: serializedTodo.order,
          text: serializedTodo.text,
          description: serializedTodo.description,
        })),
        notToDoList: serializedGoal.notToDoList.map(serializedDistraction => ({
          id: serializedDistraction.id,
          createdAt: this.deserializeTimestamp(serializedDistraction.createdAt)!,
          updatedAt: this.deserializeTimestamp(serializedDistraction.updatedAt)!,
          title: serializedDistraction.title,
          description: serializedDistraction.description,
          triggerPatterns: serializedDistraction.triggerPatterns,
          count: serializedDistraction.count,
        })),
        stickyNotes: serializedGoal.stickyNotes.map(serializedNote => ({
          id: serializedNote.id,
          createdAt: this.deserializeTimestamp(serializedNote.createdAt)!,
          updatedAt: this.deserializeTimestamp(serializedNote.updatedAt)!,
          title: serializedNote.title,
          content: serializedNote.content,
          color: serializedNote.color,
        })),
        routineSettings: {
          sleep: serializedGoal.routineSettings.sleep
            ? {
                wakeTime: serializedGoal.routineSettings.sleep.wakeTime,
                sleepTime: serializedGoal.routineSettings.sleep.sleepTime,
                naps: serializedGoal.routineSettings.sleep.naps.map(serializedNap => ({
                  id: serializedNap.id,
                  createdAt: this.deserializeTimestamp(serializedNap.createdAt)!,
                  updatedAt: this.deserializeTimestamp(serializedNap.updatedAt)!,
                  completedAt: this.deserializeTimestamp(serializedNap.completedAt),
                  completed: serializedNap.completed,
                  time: serializedNap.time,
                  duration: serializedNap.duration,
                  label: serializedNap.label,
                  icon: serializedNap.icon,
                })),
              }
            : null,
          water: serializedGoal.routineSettings.water, // Already primitive types
          bath: serializedGoal.routineSettings.bath.map(r => ({
            id: r.id,
            createdAt: this.deserializeTimestamp(r.createdAt)!,
            updatedAt: this.deserializeTimestamp(r.updatedAt)!,
            completedAt: this.deserializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          exercise: serializedGoal.routineSettings.exercise.map(r => ({
            id: r.id,
            createdAt: this.deserializeTimestamp(r.createdAt)!,
            updatedAt: this.deserializeTimestamp(r.updatedAt)!,
            completedAt: this.deserializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          meal: serializedGoal.routineSettings.meal.map(r => ({
            id: r.id,
            createdAt: this.deserializeTimestamp(r.createdAt)!,
            updatedAt: this.deserializeTimestamp(r.updatedAt)!,
            completedAt: this.deserializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          teeth: serializedGoal.routineSettings.teeth.map(r => ({
            id: r.id,
            createdAt: this.deserializeTimestamp(r.createdAt)!,
            updatedAt: this.deserializeTimestamp(r.updatedAt)!,
            completedAt: this.deserializeTimestamp(r.completedAt),
            completed: r.completed,
            time: r.time,
            duration: r.duration,
            label: r.label,
            icon: r.icon,
          })),
          lastRoutineResetDate: this.deserializeTimestamp(
            serializedGoal.routineSettings.lastRoutineResetDate
          ),
        } as UserRoutineSettings, // Explicitly cast
        starredQuotes: serializedGoal.starredQuotes, // Already simple types
      };
    }

    return {
      activeGoalId: serializedData.activeGoalId,
      goals: deserializedGoals,
    };
  }

  // --- NEW: Serialization / Deserialization methods for INDIVIDUAL Goals (for Goals Page) ---
  /**
   * Serializes a single Goal object into a plain JavaScript object
   * with Timestamps converted to ISO date strings, suitable for export.
   * @param goal The Goal object to serialize.
   * @returns A SerializableGoal object.
   */
  serializeGoalForExport(goal: Goal): SerializableGoal {
    // This logic is essentially the same as how a single goal is handled in serializeAppState
    return {
      id: goal.id,
      createdAt: this.serializeTimestamp(goal.createdAt)!,
      updatedAt: this.serializeTimestamp(goal.updatedAt)!,
      name: goal.name,
      description: goal.description,
      startDate: this.serializeTimestamp(goal.startDate)!,
      endDate: this.serializeTimestamp(goal.endDate)!,
      status: goal.status,
      dailyProgress: Object.fromEntries(
        Object.entries(goal.dailyProgress).map(([dateKey, dp]) => [
          dateKey,
          {
            date: dp.date,
            satisfaction: dp.satisfaction,
            notes: dp.notes,
            routines: dp.routines,
            sessions: dp.sessions.map(s => ({
              id: s.id,
              createdAt: this.serializeTimestamp(s.createdAt)!,
              updatedAt: this.serializeTimestamp(s.updatedAt)!,
              startTime: this.serializeTimestamp(s.startTime)!,
              label: s.label,
              duration: s.duration,
            })),
          } as SerializableDailyProgress,
        ])
      ),
      toDoList: goal.toDoList.map(todo => ({
        id: todo.id,
        createdAt: this.serializeTimestamp(todo.createdAt)!,
        updatedAt: this.serializeTimestamp(todo.updatedAt)!,
        completedAt: this.serializeTimestamp(todo.completedAt),
        deadline: this.serializeTimestamp(todo.deadline),
        completed: todo.completed,
        order: todo.order,
        text: todo.text,
        description: todo.description,
      })),
      notToDoList: goal.notToDoList.map(distraction => ({
        id: distraction.id,
        createdAt: this.serializeTimestamp(distraction.createdAt)!,
        updatedAt: this.serializeTimestamp(distraction.updatedAt)!,
        title: distraction.title,
        description: distraction.description,
        triggerPatterns: distraction.triggerPatterns,
        count: distraction.count,
      })),
      stickyNotes: goal.stickyNotes.map(note => ({
        id: note.id,
        createdAt: this.serializeTimestamp(note.createdAt)!,
        updatedAt: this.serializeTimestamp(note.updatedAt)!,
        title: note.title,
        content: note.content,
        color: note.color,
      })),
      routineSettings: {
        sleep: goal.routineSettings.sleep
          ? {
              wakeTime: goal.routineSettings.sleep.wakeTime,
              sleepTime: goal.routineSettings.sleep.sleepTime,
              naps: goal.routineSettings.sleep.naps.map(nap => ({
                id: nap.id,
                createdAt: this.serializeTimestamp(nap.createdAt)!,
                updatedAt: this.serializeTimestamp(nap.updatedAt)!,
                completedAt: this.serializeTimestamp(nap.completedAt),
                completed: nap.completed,
                time: nap.time,
                duration: nap.duration,
                label: nap.label,
                icon: nap.icon,
              })),
            }
          : null,
        water: goal.routineSettings.water,
        bath: goal.routineSettings.bath.map(r => ({
          id: r.id,
          createdAt: this.serializeTimestamp(r.createdAt)!,
          updatedAt: this.serializeTimestamp(r.updatedAt)!,
          completedAt: this.serializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        exercise: goal.routineSettings.exercise.map(r => ({
          id: r.id,
          createdAt: this.serializeTimestamp(r.createdAt)!,
          updatedAt: this.serializeTimestamp(r.updatedAt)!,
          completedAt: this.serializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        meal: goal.routineSettings.meal.map(r => ({
          id: r.id,
          createdAt: this.serializeTimestamp(r.createdAt)!,
          updatedAt: this.serializeTimestamp(r.updatedAt)!,
          completedAt: this.serializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        teeth: goal.routineSettings.teeth.map(r => ({
          id: r.id,
          createdAt: this.serializeTimestamp(r.createdAt)!,
          updatedAt: this.serializeTimestamp(r.updatedAt)!,
          completedAt: this.serializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        lastRoutineResetDate: this.serializeTimestamp(goal.routineSettings.lastRoutineResetDate),
      },
      starredQuotes: goal.starredQuotes,
    };
  }

  /**
   * Deserializes a plain JavaScript object (from import) back into a Goal object
   * with ISO date strings converted to Firebase Timestamps.
   * Note: This function will typically be used when importing a goal to *create a new one*.
   * It will generate new IDs and timestamps if the original ones are not suitable for new creation.
   * @param serializedGoalData The SerializableGoal object to deserialize.
   * @returns A Goal object.
   */
  deserializeGoalForImport(serializedGoalData: SerializableGoal): Goal {
    const now = Timestamp.now();
    // When importing an individual goal, we typically want to assign it a new ID and timestamps
    // to prevent conflicts if it's being added as a 'new' goal from a backup.
    // However, if the intent is to replace an *existing* goal with this data (by matching ID),
    // then the ID and timestamps should be preserved.
    // For the purpose of "importing a goal to create a new one", we generate new IDs.
    const newGoalId = generateUUID();

    const deserializedGoal: Goal = {
      id: serializedGoalData.id || newGoalId, // Use existing ID or generate new if creating new goal
      createdAt: this.deserializeTimestamp(serializedGoalData.createdAt) || now,
      updatedAt: this.deserializeTimestamp(serializedGoalData.updatedAt) || now,
      name: serializedGoalData.name,
      description: serializedGoalData.description,
      startDate: this.deserializeTimestamp(serializedGoalData.startDate)!,
      endDate: this.deserializeTimestamp(serializedGoalData.endDate)!,
      status: serializedGoalData.status,
      dailyProgress: Object.fromEntries(
        Object.entries(serializedGoalData.dailyProgress).map(([dateKey, serializedDp]) => [
          dateKey,
          {
            date: serializedDp.date,
            satisfaction: serializedDp.satisfaction,
            notes: serializedDp.notes,
            routines: serializedDp.routines,
            sessions: serializedDp.sessions.map(s => ({
              id: s.id || generateUUID(), // Ensure new ID for sessions too if creating new goal
              createdAt: this.deserializeTimestamp(s.createdAt) || now,
              updatedAt: this.deserializeTimestamp(s.updatedAt) || now,
              startTime: this.deserializeTimestamp(s.startTime)!,
              label: s.label,
              duration: s.duration,
            })),
          } as DailyProgress,
        ])
      ),
      toDoList: serializedGoalData.toDoList.map(serializedTodo => ({
        id: serializedTodo.id || generateUUID(),
        createdAt: this.deserializeTimestamp(serializedTodo.createdAt) || now,
        updatedAt: this.deserializeTimestamp(serializedTodo.updatedAt) || now,
        completedAt: this.deserializeTimestamp(serializedTodo.completedAt),
        deadline: this.deserializeTimestamp(serializedTodo.deadline),
        completed: serializedTodo.completed,
        order: serializedTodo.order,
        text: serializedTodo.text,
        description: serializedTodo.description,
      })),
      notToDoList: serializedGoalData.notToDoList.map(serializedDistraction => ({
        id: serializedDistraction.id || generateUUID(),
        createdAt: this.deserializeTimestamp(serializedDistraction.createdAt) || now,
        updatedAt: this.deserializeTimestamp(serializedDistraction.updatedAt) || now,
        title: serializedDistraction.title,
        description: serializedDistraction.description,
        triggerPatterns: serializedDistraction.triggerPatterns,
        count: serializedDistraction.count,
      })),
      stickyNotes: serializedGoalData.stickyNotes.map(serializedNote => ({
        id: serializedNote.id || generateUUID(),
        createdAt: this.deserializeTimestamp(serializedNote.createdAt) || now,
        updatedAt: this.deserializeTimestamp(serializedNote.updatedAt) || now,
        title: serializedNote.title,
        content: serializedNote.content,
        color: serializedNote.color,
      })),
      routineSettings: {
        sleep: serializedGoalData.routineSettings.sleep
          ? {
              wakeTime: serializedGoalData.routineSettings.sleep.wakeTime,
              sleepTime: serializedGoalData.routineSettings.sleep.sleepTime,
              naps: serializedGoalData.routineSettings.sleep.naps.map(serializedNap => ({
                id: serializedNap.id || generateUUID(),
                createdAt: this.deserializeTimestamp(serializedNap.createdAt) || now,
                updatedAt: this.deserializeTimestamp(serializedNap.updatedAt) || now,
                completedAt: this.deserializeTimestamp(serializedNap.completedAt),
                completed: serializedNap.completed,
                time: serializedNap.time,
                duration: serializedNap.duration,
                label: serializedNap.label,
                icon: serializedNap.icon,
              })),
            }
          : null,
        water: serializedGoalData.routineSettings.water,
        bath: serializedGoalData.routineSettings.bath.map(r => ({
          id: r.id || generateUUID(),
          createdAt: this.deserializeTimestamp(r.createdAt) || now,
          updatedAt: this.deserializeTimestamp(r.updatedAt) || now,
          completedAt: this.deserializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        exercise: serializedGoalData.routineSettings.exercise.map(r => ({
          id: r.id || generateUUID(),
          createdAt: this.deserializeTimestamp(r.createdAt) || now,
          updatedAt: this.deserializeTimestamp(r.updatedAt) || now,
          completedAt: this.deserializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        meal: serializedGoalData.routineSettings.meal.map(r => ({
          id: r.id || generateUUID(),
          createdAt: this.deserializeTimestamp(r.createdAt) || now,
          updatedAt: this.deserializeTimestamp(r.updatedAt) || now,
          completedAt: this.deserializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        teeth: serializedGoalData.routineSettings.teeth.map(r => ({
          id: r.id || generateUUID(),
          createdAt: this.deserializeTimestamp(r.createdAt) || now,
          updatedAt: this.deserializeTimestamp(r.updatedAt) || now,
          completedAt: this.deserializeTimestamp(r.completedAt),
          completed: r.completed,
          time: r.time,
          duration: r.duration,
          label: r.label,
          icon: r.icon,
        })),
        lastRoutineResetDate:
          this.deserializeTimestamp(serializedGoalData.routineSettings.lastRoutineResetDate) ||
          null, // Ensure default to null if not present
      },
      starredQuotes: serializedGoalData.starredQuotes,
    };

    // When importing to create a NEW goal, force a new ID and current timestamps
    // and reset its status to ACTIVE.
    return {
      ...deserializedGoal,
      id: newGoalId, // Ensure it gets a new ID
      createdAt: now, // New creation timestamp
      updatedAt: now, // New update timestamp
      status: GoalStatus.ACTIVE, // New goal from import starts as active
    };
  }
}

export const firebaseService = new FirebaseService();
