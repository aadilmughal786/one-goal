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
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import {
  AppState,
  Goal,
  ListItem,
  TodoItem,
  DailyProgress,
  SatisfactionLevel,
  StopwatchSession, // --- NEW --- Import the new type
} from '@/types';
import { FirebaseServiceError } from '@/utils/errors';

/**
 * A type representing the raw, serializable state of the application for import/export.
 * All Timestamp objects are converted to ISO 8601 strings.
 */
interface SerializableAppState {
  goal: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  } | null;
  dailyProgress: Array<{
    date: string;
    satisfactionLevel: SatisfactionLevel;
    timeSpentMinutes: number;
    notes?: string;
  }>;
  notToDoList: ListItem[];
  contextList: ListItem[];
  toDoList: Array<{
    id: number;
    text: string;
    completed: boolean;
    startDate: string;
  }>;
  // --- NEW --- Add stopwatch sessions to the serializable type
  stopwatchSessions?: Array<{
    id: number;
    label: string;
    durationMs: number;
    date: string;
  }>;
}

/**
 * Manages all Firebase interactions, including authentication and Firestore database operations.
 */
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

  // --- Authentication ---

  /**
   * Listens for changes to the user's authentication state.
   * @param callback A function to call with the User object or null.
   * @returns An unsubscribe function from Firebase.
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Initiates the Google Sign-In process via a popup.
   * @returns A Promise that resolves with the signed-in User object.
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
   * Signs out the currently authenticated user.
   * @returns A Promise that resolves when sign-out is complete.
   */
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign out.', error);
    }
  }

  // --- Core Data Management (Import/Export/Reset) ---

  /**
   * Retrieves the entire user data object from Firestore.
   * This serves as the source for the "Export Data" feature and initial app state loading.
   * It also fills in any missed days for daily progress tracking.
   * @param userId The UID of the current user.
   * @returns A Promise that resolves with the complete AppState.
   */
  async getUserData(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as AppState;
        const filledDailyProgress = this.fillMissingProgress(
          firestoreData.goal,
          firestoreData.dailyProgress || []
        );
        return { ...firestoreData, dailyProgress: filledDailyProgress };
      } else {
        return this.resetUserData(userId);
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to load user data for ID: ${userId}.`, error);
    }
  }

  /**
   * Overwrites the user's entire data object in Firestore. Used by the "Import Data" feature.
   * @param userId The UID of the current user.
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
   * Resets the user's data to the initial empty state. Used when creating a new goal.
   * @param userId The UID of the current user.
   * @returns A Promise that resolves with the initial, empty AppState.
   */
  async resetUserData(userId: string): Promise<AppState> {
    const initialData: AppState = {
      goal: null,
      notToDoList: [],
      contextList: [],
      toDoList: [],
      dailyProgress: [],
      stopwatchSessions: [], // --- NEW --- Ensure it's reset
    };
    await this.setUserData(userId, initialData);
    return initialData;
  }

  // --- Import / Export Helpers ---

  /** * Converts AppState with Firestore Timestamps to a serializable object with ISO date strings.
   * @param appState The current state of the application.
   * @returns A plain JavaScript object suitable for JSON serialization.
   */
  serializeForExport(appState: AppState): SerializableAppState {
    return {
      goal: appState.goal
        ? {
            ...appState.goal,
            startDate: appState.goal.startDate.toDate().toISOString(),
            endDate: appState.goal.endDate.toDate().toISOString(),
          }
        : null,
      dailyProgress: appState.dailyProgress.map(p => ({
        ...p,
        date: p.date.toDate().toISOString(),
      })),
      toDoList: appState.toDoList.map(t => ({
        ...t,
        startDate: t.startDate.toDate().toISOString(),
      })),
      // --- NEW --- Serialize stopwatch sessions
      stopwatchSessions: (appState.stopwatchSessions || []).map(s => ({
        ...s,
        date: s.date.toDate().toISOString(),
      })),
      notToDoList: appState.notToDoList,
      contextList: appState.contextList,
    };
  }

  /** * Converts a raw imported object with date strings back to an AppState with Firestore Timestamps.
   * @param importedData The raw data object, typically from a JSON file.
   * @returns A valid AppState object with Timestamps.
   */
  deserializeForImport(importedData: Partial<SerializableAppState>): AppState {
    const safeToDate = (dateString: string | undefined): Timestamp => {
      if (!dateString) return Timestamp.now();
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
    };

    return {
      goal: importedData.goal
        ? {
            ...importedData.goal,
            startDate: safeToDate(importedData.goal.startDate),
            endDate: safeToDate(importedData.goal.endDate),
          }
        : null,
      dailyProgress: (importedData.dailyProgress || []).map(p => ({
        ...p,
        date: safeToDate(p.date),
      })),
      toDoList: (importedData.toDoList || []).map(t => ({
        ...t,
        startDate: safeToDate(t.startDate),
      })),
      // --- NEW --- Deserialize stopwatch sessions
      stopwatchSessions: (importedData.stopwatchSessions || []).map(s => ({
        ...s,
        date: safeToDate(s.date),
      })),
      notToDoList: importedData.notToDoList || [],
      contextList: importedData.contextList || [],
    };
  }

  // --- Goal Management ---

  /**
   * Creates or updates the user's main goal. Pass `null` to remove the goal.
   * @param userId The UID of the current user.
   * @param goal The new Goal object, or null.
   */
  async updateGoal(userId: string, goal: Goal | null): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { goal });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update goal for user ID: ${userId}.`, error);
    }
  }

  // --- Generic List Management ---

  /**
   * Adds an item to a specified list ('notToDoList', 'contextList', or 'toDoList').
   * @param userId The UID of the current user.
   * @param listName The key of the list in the AppState.
   * @param item The ListItem or TodoItem to add.
   */
  async addItemToList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    item: ListItem | TodoItem
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { [listName]: arrayUnion(item) });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to add item to ${listName}.`, error);
    }
  }

  /**
   * Updates an existing item within a specified list.
   * @param userId The UID of the current user.
   * @param listName The key of the list in the AppState.
   * @param itemId The ID of the item to update.
   * @param updates A partial object with the fields to update.
   */
  async updateItemInList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: number,
    updates: Partial<ListItem | TodoItem>
  ): Promise<void> {
    const docRef = doc(this.db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentData = docSnap.data() as AppState;
      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const updatedList = list.map(item => (item.id === itemId ? { ...item, ...updates } : item));
      await updateDoc(docRef, { [listName]: updatedList });
    }
  }

  /**
   * Removes an item from a specified list by its ID.
   * @param userId The UID of the current user.
   * @param listName The key of the list in the AppState.
   * @param itemId The ID of the item to remove.
   */
  async removeItemFromList(
    userId: string,
    listName: 'notToDoList' | 'contextList' | 'toDoList',
    itemId: number
  ): Promise<void> {
    const docRef = doc(this.db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentData = docSnap.data() as AppState;
      const list = (currentData[listName] || []) as Array<ListItem | TodoItem>;
      const updatedList = list.filter(item => item.id !== itemId);
      await updateDoc(docRef, { [listName]: updatedList });
    }
  }

  // --- Daily Progress Management ---

  /**
   * Creates or updates a progress entry for a specific day.
   * @param userId The UID of the current user.
   * @param progressData The DailyProgress object to save.
   */
  async saveDailyProgress(userId: string, progressData: DailyProgress): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as AppState;
        const existingProgress = currentData.dailyProgress || [];
        const dateKey = progressData.date.toDate().toISOString().split('T')[0];
        const itemIndex = existingProgress.findIndex(
          p => p.date.toDate().toISOString().split('T')[0] === dateKey
        );

        let updatedProgress: DailyProgress[];
        if (itemIndex > -1) {
          updatedProgress = [...existingProgress];
          updatedProgress[itemIndex] = progressData;
        } else {
          updatedProgress = [...existingProgress, progressData];
        }

        updatedProgress.sort((a, b) => a.date.toMillis() - b.date.toMillis());
        await updateDoc(userDocRef, { dailyProgress: updatedProgress });
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to save daily progress for user ID: ${userId}.`,
        error
      );
    }
  }

  // --- NEW --- Stopwatch Session Management
  /**
   * Adds a new stopwatch session to the user's data.
   * @param userId The UID of the current user.
   * @param session The StopwatchSession object to save.
   */
  async addStopwatchSession(userId: string, session: StopwatchSession): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      // Use arrayUnion to add the new session to the existing array.
      await updateDoc(userDocRef, {
        stopwatchSessions: arrayUnion(session),
      });
    } catch (error: unknown) {
      // If the field doesn't exist, it might throw. A more robust solution
      // could be to read the doc, update the array in code, and then set it.
      // For simplicity, arrayUnion is often sufficient if the field is initialized.
      throw new FirebaseServiceError('Failed to add stopwatch session.', error);
    }
  }

  // --- Private Helper Methods ---

  /** Fills in any past days that were not logged with a default 'Very Low' entry. */
  private fillMissingProgress(
    goal: Goal | null,
    existingProgress: DailyProgress[]
  ): DailyProgress[] {
    if (!goal) return existingProgress;

    const filledProgress: DailyProgress[] = [];
    const progressMap = new Map<string, DailyProgress>();
    existingProgress.forEach(p => {
      const dateKey = p.date.toDate().toISOString().split('T')[0];
      progressMap.set(dateKey, p);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = goal.startDate.toDate();
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= today && currentDate <= goal.endDate.toDate()) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (progressMap.has(dateKey)) {
        filledProgress.push(progressMap.get(dateKey)!);
      } else {
        filledProgress.push({
          date: Timestamp.fromDate(currentDate),
          satisfactionLevel: SatisfactionLevel.VERY_LOW,
          timeSpentMinutes: 0,
          notes: 'No entry recorded.',
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const futureProgress = existingProgress.filter(p => p.date.toDate() > today);
    return [...filledProgress, ...futureProgress].sort(
      (a, b) => a.date.toMillis() - b.date.toMillis()
    );
  }
}

export const firebaseService = new FirebaseService();
