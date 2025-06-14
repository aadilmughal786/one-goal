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
  StopwatchSession,
} from '@/types';
import { FirebaseServiceError } from '@/utils/errors';

// ... (Keep the existing SerializableAppState interface as is)
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
  stopwatchSessions?: Array<{
    id: number;
    label: string;
    durationMs: number;
    date: string;
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

  // ... (Keep all existing methods like onAuthChange, signInWithGoogle, etc., as they are)
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
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

  async setUserData(userId: string, dataToSet: AppState): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await setDoc(userDocRef, dataToSet);
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to set user data for ID: ${userId}.`, error);
    }
  }

  async resetUserData(userId: string): Promise<AppState> {
    const initialData: AppState = {
      goal: null,
      notToDoList: [],
      contextList: [],
      toDoList: [],
      dailyProgress: [],
      stopwatchSessions: [],
    };
    await this.setUserData(userId, initialData);
    return initialData;
  }

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
      stopwatchSessions: (appState.stopwatchSessions || []).map(s => ({
        ...s,
        date: s.date.toDate().toISOString(),
      })),
      notToDoList: appState.notToDoList,
      contextList: appState.contextList,
    };
  }

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
      stopwatchSessions: (importedData.stopwatchSessions || []).map(s => ({
        ...s,
        date: safeToDate(s.date),
      })),
      notToDoList: importedData.notToDoList || [],
      contextList: importedData.contextList || [],
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

  async addStopwatchSession(userId: string, session: StopwatchSession): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        stopwatchSessions: arrayUnion(session),
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to add stopwatch session.', error);
    }
  }

  // --- NEW ---
  /**
   * Overwrites the entire to-do list with a new, reordered list.
   * @param userId The UID of the current user.
   * @param newTodoList The full, reordered array of to-do items.
   */
  async updateTodoListOrder(userId: string, newTodoList: TodoItem[]): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { toDoList: newTodoList });
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to update to-do list order.', error);
    }
  }

  // --- Private Helper Methods ---

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
