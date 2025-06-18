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
  updateProfile, // <-- Import updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  deleteField,
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
  RoutineType,
  RoutineLog,
} from '@/types';
import { FirebaseServiceError } from '@/utils/errors';
import { format, isSameDay } from 'date-fns';

// Helper for generating UUIDs for new item IDs
const generateUUID = () => crypto.randomUUID();

// Serializable interfaces for import/export
interface SerializableScheduledRoutineBase {
  scheduledTime: string;
  durationMinutes: number;
  label: string;
  icon: string;
  completed: boolean | null;
}

interface SerializableSleepRoutineSettings {
  bedtime: string;
  wakeTime: string;
  napSchedule: SerializableScheduledRoutineBase[];
}

interface SerializableListItem extends Omit<ListItem, 'createdAt'> {
  createdAt: string;
}

interface SerializableTodoItem extends Omit<TodoItem, 'createdAt' | 'completedAt' | 'deadline'> {
  createdAt: string;
  completedAt: string | null;
  deadline: string | null;
}

interface SerializableAppState {
  goal: {
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
  } | null;
  dailyProgress: Array<
    Omit<DailyProgress, 'stopwatchSessions'> & {
      stopwatchSessions: Array<Omit<StopwatchSession, 'startTime'> & { startTime: string }>;
    }
  >;
  toDoList: SerializableTodoItem[];
  notToDoList: SerializableListItem[];
  contextList: SerializableListItem[];
  routineSettings: {
    sleep: SerializableSleepRoutineSettings | null;
    bath: SerializableScheduledRoutineBase[];
    water: WaterRoutineSettings | null;
    exercise: SerializableScheduledRoutineBase[];
    meals: SerializableScheduledRoutineBase[];
    teeth: SerializableScheduledRoutineBase[];
    lastRoutineResetDate: string | null;
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

  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  // --- NEW: Function to update user profile ---
  async updateUserProfile(
    user: User,
    updates: { displayName?: string; photoURL?: string }
  ): Promise<void> {
    try {
      await updateProfile(user, updates);
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update user profile.', error);
    }
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign in with Google.', error);
    }
  }

  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign out.', error);
    }
  }

  private _initializeRoutineLog(): RoutineLog {
    const log: Partial<RoutineLog> = {};
    for (const type of Object.values(RoutineType)) {
      log[type] = null;
    }
    return log as RoutineLog;
  }

  private _initializeDefaultState(): AppState {
    return {
      goal: null,
      dailyProgress: {},
      toDoList: [],
      notToDoList: [],
      contextList: [],
      routineSettings: {
        sleep: null,
        bath: [],
        water: null,
        exercise: [],
        meals: [],
        teeth: [],
        lastRoutineResetDate: null,
      },
    };
  }

  async getUserData(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        const initialState = this._initializeDefaultState();
        await setDoc(userDocRef, initialState);
        return initialState;
      }

      const data = docSnap.data() as Partial<AppState>;
      const appState: AppState = { ...this._initializeDefaultState(), ...data };

      // Ensure all nested objects and arrays are initialized to prevent runtime errors
      appState.dailyProgress = appState.dailyProgress || {};
      appState.toDoList = appState.toDoList || [];
      appState.notToDoList = appState.notToDoList || [];
      appState.contextList = appState.contextList || [];
      if (!appState.routineSettings) {
        appState.routineSettings = this._initializeDefaultState().routineSettings!;
      } else {
        appState.routineSettings.bath = appState.routineSettings.bath || [];
        appState.routineSettings.exercise = appState.routineSettings.exercise || [];
        appState.routineSettings.meals = appState.routineSettings.meals || [];
        appState.routineSettings.teeth = appState.routineSettings.teeth || [];
        if (appState.routineSettings.sleep) {
          appState.routineSettings.sleep.napSchedule =
            appState.routineSettings.sleep.napSchedule || [];
        }
      }

      // --- Daily Routine Completion Status Reset ---
      const lastReset = appState.routineSettings.lastRoutineResetDate?.toDate();
      const now = new Date();
      if (!lastReset || !isSameDay(lastReset, now)) {
        let needsUpdate = false;

        const resetSchedules = (schedules: ScheduledRoutineBase[]) => {
          return schedules.map(s => {
            if (s.completed) {
              needsUpdate = true;
              return { ...s, completed: false };
            }
            return s;
          });
        };

        appState.routineSettings.bath = resetSchedules(appState.routineSettings.bath);
        appState.routineSettings.exercise = resetSchedules(appState.routineSettings.exercise);
        appState.routineSettings.meals = resetSchedules(appState.routineSettings.meals);
        appState.routineSettings.teeth = resetSchedules(appState.routineSettings.teeth);

        if (
          appState.routineSettings.water &&
          appState.routineSettings.water.currentWaterGlasses > 0
        ) {
          appState.routineSettings.water.currentWaterGlasses = 0;
          needsUpdate = true;
        }

        if (needsUpdate) {
          appState.routineSettings.lastRoutineResetDate = Timestamp.fromDate(now);
          await updateDoc(userDocRef, { routineSettings: appState.routineSettings });
        }
      }

      return appState;
    } catch (error) {
      throw new FirebaseServiceError(`Failed to load user data for ID: ${userId}.`, error);
    }
  }

  async setUserData(userId: string, dataToSet: AppState): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await setDoc(userDocRef, dataToSet);
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to set user data for ID: ${userId}.`, error);
    }
  }

  async resetUserData(userId: string): Promise<AppState> {
    const initialData = this._initializeDefaultState();
    await this.setUserData(userId, initialData);
    return initialData;
  }

  private serializeTimestamp(ts: Timestamp | null): string | null {
    return ts ? ts.toDate().toISOString() : null;
  }

  private deserializeTimestamp(dateString: string | null): Timestamp | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
  }

  serializeForExport(appState: AppState): SerializableAppState {
    return {
      goal: appState.goal
        ? {
            ...appState.goal,
            startDate: this.serializeTimestamp(appState.goal.startDate)!,
            endDate: this.serializeTimestamp(appState.goal.endDate)!,
          }
        : null,
      dailyProgress: Object.values(appState.dailyProgress || {}).map(dp => ({
        ...dp,
        stopwatchSessions: dp.stopwatchSessions.map(s => ({
          ...s,
          startTime: this.serializeTimestamp(s.startTime)!,
        })),
      })),
      toDoList: (appState.toDoList || []).map(todo => ({
        ...todo,
        createdAt: this.serializeTimestamp(todo.createdAt)!,
        completedAt: this.serializeTimestamp(todo.completedAt),
        deadline: this.serializeTimestamp(todo.deadline),
      })),
      notToDoList: (appState.notToDoList || []).map(item => ({
        ...item,
        createdAt: this.serializeTimestamp(item.createdAt)!,
      })),
      contextList: (appState.contextList || []).map(item => ({
        ...item,
        createdAt: this.serializeTimestamp(item.createdAt)!,
      })),
      routineSettings: appState.routineSettings
        ? {
            ...appState.routineSettings,
            lastRoutineResetDate: this.serializeTimestamp(
              appState.routineSettings.lastRoutineResetDate
            ),
          }
        : null,
    };
  }

  deserializeForImport(importedData: Partial<SerializableAppState>): AppState {
    const defaultState = this._initializeDefaultState();
    return {
      goal: importedData.goal
        ? {
            ...importedData.goal,
            startDate: this.deserializeTimestamp(importedData.goal.startDate)!,
            endDate: this.deserializeTimestamp(importedData.goal.endDate)!,
          }
        : null,
      dailyProgress: Object.fromEntries(
        (importedData.dailyProgress || []).map(dp => [
          dp.date,
          {
            ...dp,
            stopwatchSessions: (dp.stopwatchSessions || []).map(s => ({
              ...s,
              startTime: this.deserializeTimestamp(s.startTime)!,
            })),
          },
        ])
      ),
      toDoList: (importedData.toDoList || []).map(todo => ({
        ...todo,
        createdAt: this.deserializeTimestamp(todo.createdAt)!,
        completedAt: this.deserializeTimestamp(todo.completedAt),
        deadline: this.deserializeTimestamp(todo.deadline),
      })),
      notToDoList: (importedData.notToDoList || []).map(item => ({
        ...item,
        createdAt: this.deserializeTimestamp(item.createdAt)!,
      })),
      contextList: (importedData.contextList || []).map(item => ({
        ...item,
        createdAt: this.deserializeTimestamp(item.createdAt)!,
      })),
      routineSettings: importedData.routineSettings
        ? {
            ...importedData.routineSettings,
            lastRoutineResetDate: this.deserializeTimestamp(
              importedData.routineSettings.lastRoutineResetDate
            ),
          }
        : defaultState.routineSettings,
    };
  }

  async updateGoal(userId: string, goal: Goal | null): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { goal });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update goal for user ID: ${userId}.`, error);
    }
  }

  async addItemToList(
    userId: string,
    listName: 'notToDoList' | 'contextList',
    text: string
  ): Promise<ListItem> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;
      const newItem: ListItem = {
        id: generateUUID(),
        text: text.trim(),
        createdAt: Timestamp.now(),
      };
      const updatedList = [...(currentData[listName] || []), newItem];
      await updateDoc(userDocRef, { [listName]: updatedList });
      return newItem;
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to add item to ${listName}.`, error);
    }
  }

  async updateItemInList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: string,
    updates: Partial<TodoItem | ListItem>
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;

      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const updatedList = list.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          if (listName === 'toDoList') {
            const todo = updatedItem as TodoItem;
            if ('completed' in updates) {
              todo.completedAt = updates.completed ? Timestamp.now() : null;
            }
          }
          return updatedItem;
        }
        return item;
      });

      await updateDoc(userDocRef, { [listName]: updatedList });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update item in ${listName}.`, error);
    }
  }

  async removeItemFromList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: string
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;
      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const updatedList = list.filter(item => item.id !== itemId);
      await updateDoc(userDocRef, { [listName]: updatedList });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to remove item from ${listName}.`, error);
    }
  }

  async saveDailyProgress(userId: string, progressData: DailyProgress): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;

      const existingProgress = (currentData.dailyProgress || {})[progressData.date] || {
        routineLog: this._initializeRoutineLog(),
      };

      const updatedProgressData: DailyProgress = {
        ...existingProgress,
        ...progressData,
        routineLog: { ...existingProgress.routineLog, ...progressData.routineLog },
      };

      const totalDurationMs = (updatedProgressData.stopwatchSessions || []).reduce(
        (sum, s) => sum + s.durationMs,
        0
      );
      updatedProgressData.effortTimeMinutes =
        totalDurationMs > 0 ? Math.round(totalDurationMs / 60000) : null;

      await updateDoc(userDocRef, {
        [`dailyProgress.${progressData.date}`]: updatedProgressData,
      });
    } catch (error) {
      throw new FirebaseServiceError(
        `Failed to save daily progress for date ${progressData.date}.`,
        error
      );
    }
  }

  async deleteDailyProgress(userId: string, dateKey: string): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        [`dailyProgress.${dateKey}`]: deleteField(),
      });
    } catch (error) {
      throw new FirebaseServiceError(`Failed to delete daily progress for date ${dateKey}.`, error);
    }
  }

  async addStopwatchSession(
    userId: string,
    session: Omit<StopwatchSession, 'startTime'> & { startTime?: Timestamp }
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;

      const sessionWithTime: StopwatchSession = {
        ...session,
        startTime: session.startTime || Timestamp.now(),
      };
      const sessionDateKey = format(sessionWithTime.startTime.toDate(), 'yyyy-MM-dd');

      const existingDailyProgress = (currentData.dailyProgress || {})[sessionDateKey] || {
        date: sessionDateKey,
        satisfactionLevel: SatisfactionLevel.MEDIUM,
        progressNote: '',
        stopwatchSessions: [],
        effortTimeMinutes: null,
        routineLog: this._initializeRoutineLog(),
      };

      const newSessions = [...existingDailyProgress.stopwatchSessions, sessionWithTime];
      const totalDurationMs = newSessions.reduce((sum, s) => sum + s.durationMs, 0);

      const updatedDailyProgress: DailyProgress = {
        ...existingDailyProgress,
        stopwatchSessions: newSessions,
        effortTimeMinutes: Math.round(totalDurationMs / 60000),
      };

      await updateDoc(userDocRef, {
        [`dailyProgress.${sessionDateKey}`]: updatedDailyProgress,
      });
    } catch (error) {
      throw new FirebaseServiceError('Failed to add stopwatch session.', error);
    }
  }

  async updateStopwatchSession(
    userId: string,
    dateKey: string,
    sessionStartTime: Timestamp,
    newLabel: string
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;
      const dailyProgress = currentData.dailyProgress?.[dateKey];

      if (dailyProgress) {
        const updatedSessions = dailyProgress.stopwatchSessions.map(session => {
          if (session.startTime.isEqual(sessionStartTime)) {
            return { ...session, label: newLabel };
          }
          return session;
        });

        const updatedDailyProgress: DailyProgress = {
          ...dailyProgress,
          stopwatchSessions: updatedSessions,
        };

        await updateDoc(userDocRef, {
          [`dailyProgress.${dateKey}`]: updatedDailyProgress,
        });
      }
    } catch (error) {
      throw new FirebaseServiceError('Failed to update stopwatch session.', error);
    }
  }

  async deleteStopwatchSession(
    userId: string,
    dateKey: string,
    sessionStartTime: Timestamp
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;
      const dailyProgress = currentData.dailyProgress?.[dateKey];

      if (dailyProgress) {
        const updatedSessions = dailyProgress.stopwatchSessions.filter(
          session => !session.startTime.isEqual(sessionStartTime)
        );
        const totalDurationMs = updatedSessions.reduce((sum, s) => sum + s.durationMs, 0);

        const updatedDailyProgress: DailyProgress = {
          ...dailyProgress,
          stopwatchSessions: updatedSessions,
          effortTimeMinutes: totalDurationMs > 0 ? Math.round(totalDurationMs / 60000) : null,
        };

        await updateDoc(userDocRef, {
          [`dailyProgress.${dateKey}`]: updatedDailyProgress,
        });
      }
    } catch (error) {
      throw new FirebaseServiceError('Failed to delete stopwatch session.', error);
    }
  }

  async updateTodoListOrder(userId: string, newTodoList: TodoItem[]): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { toDoList: newTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update to-do list order.', error);
    }
  }

  async addTodoItem(userId: string, text: string): Promise<TodoItem> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;
      const existingTodoList = currentData.toDoList || [];

      const reorderedList = existingTodoList.map(item => ({ ...item, order: item.order + 1 }));

      const newItem: TodoItem = {
        id: generateUUID(),
        text: text.trim(),
        description: null,
        order: 0,
        completed: false,
        completedAt: null,
        deadline: null,
        createdAt: Timestamp.now(), // Set createdAt on creation
      };

      const updatedTodoList = [newItem, ...reorderedList];
      await updateDoc(userDocRef, { toDoList: updatedTodoList });
      return newItem;
    } catch (error) {
      throw new FirebaseServiceError('Failed to add to-do item.', error);
    }
  }

  private async _updateRoutineSettings(
    userId: string,
    updateFn: (settings: UserRoutineSettings) => void
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) throw new FirebaseServiceError('User data not found.');
      const currentData = docSnap.data() as AppState;

      const settings =
        currentData.routineSettings || this._initializeDefaultState().routineSettings!;
      updateFn(settings);

      await updateDoc(userDocRef, { routineSettings: settings });
    } catch (error) {
      throw new FirebaseServiceError('Failed to update routine settings.', error);
    }
  }

  async updateSleepRoutineSettings(
    userId: string,
    newSettings: SleepRoutineSettings | null
  ): Promise<void> {
    await this._updateRoutineSettings(userId, settings => {
      settings.sleep = newSettings;
    });
  }

  async updateWaterRoutineSettings(
    userId: string,
    newSettings: WaterRoutineSettings | null
  ): Promise<void> {
    await this._updateRoutineSettings(userId, settings => {
      settings.water = newSettings;
    });
  }

  async updateBathRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateRoutineSettings(userId, settings => {
      settings.bath = schedules;
    });
  }

  async updateExerciseRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateRoutineSettings(userId, settings => {
      settings.exercise = schedules;
    });
  }

  async updateMealRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateRoutineSettings(userId, settings => {
      settings.meals = schedules;
    });
  }

  async updateTeethRoutineSchedules(
    userId: string,
    schedules: ScheduledRoutineBase[]
  ): Promise<void> {
    await this._updateRoutineSettings(userId, settings => {
      settings.teeth = schedules;
    });
  }
}

export const firebaseService = new FirebaseService();
