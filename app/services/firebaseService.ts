// src/services/firebaseService.ts

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { AppState, Goal, ListItem, TodoItem } from '@/types'; // Import types
import { FirebaseServiceError } from '@/utils/errors'; // Import custom error

/**
 * FirebaseService class for managing all Firebase-related operations,
 * including authentication and Firestore data persistence.
 */
class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  constructor() {
    // Firebase configuration using environment variables
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
   * Listens for Firebase authentication state changes.
   * @param callback A function to call with the current User object or null.
   * @returns An unsubscribe function.
   */
  onAuthChange(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, callback);
  }

  /**
   * Signs in the user with Google.
   * @returns A Promise that resolves with the User object or rejects with an error.
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
   * @returns A Promise that resolves when sign-out is complete.
   */
  async signOutUser(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error: unknown) {
      throw new FirebaseServiceError('Failed to sign out.', error);
    }
  }

  /**
   * Loads user data from Firestore. If no data exists, it creates an initial document.
   * @param userId The UID of the current user.
   * @returns A Promise that resolves with the loaded AppState.
   */
  async loadUserData(userId: string): Promise<AppState> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const firestoreData = docSnap.data() as AppState;
        const loadedData: AppState = {
          goal: firestoreData.goal || null,
          notToDoList: firestoreData.notToDoList || [],
          contextItems: firestoreData.contextItems || [],
          toDoList: firestoreData.toDoList || [],
        };
        return loadedData;
      } else {
        // Create initial document structure in Firestore if no data exists
        const initialData: AppState = {
          goal: null,
          notToDoList: [],
          contextItems: [],
          toDoList: [],
        };
        await setDoc(userDocRef, initialData);
        return initialData; // Return an initial AppState
      }
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to load user data for ID: ${userId}.`, error);
    }
  }

  /**
   * Saves user data to Firestore. Use for saving the entire state.
   * @param userId The UID of the current user.
   * @param dataToSave The data to save.
   * @returns A Promise that resolves when data is saved.
   */
  async saveUserData(userId: string, dataToSave: AppState): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await setDoc(userDocRef, dataToSave, { merge: true });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to save user data for ID: ${userId}.`, error);
    }
  }

  /**
   * Updates the user's main goal data in Firestore.
   * @param userId The UID of the current user.
   * @param goal The new goal object, or null to remove the goal.
   * @returns A Promise that resolves when the goal is updated.
   */
  async updateGoal(userId: string, goal: Goal | null): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, { goal: goal });
    } catch (error: unknown) {
      throw new FirebaseServiceError(`Failed to update goal for user ID: ${userId}.`, error);
    }
  }

  /**
   * Adds a new item to a specified list (notToDoList, contextItems, or toDoList).
   * @param userId The UID of the current user.
   * @param listType The name of the list to add the item to.
   * @param newItem The item to add.
   * @returns A Promise that resolves when the item is added.
   */
  async addListItem(
    userId: string,
    listType: 'notToDoList' | 'contextItems' | 'toDoList',
    newItem: ListItem | TodoItem
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        [listType]: arrayUnion(newItem),
      });
    } catch (error: unknown) {
      throw new FirebaseServiceError(
        `Failed to add item to ${listType} for user ID: ${userId}.`,
        error
      );
    }
  }

  /**
   * Deletes an item from a specified list based on its ID.
   * This operation reads the current list, filters out the item, and writes the modified list back.
   * @param userId The UID of the current user.
   * @param listType The name of the list to delete from.
   * @param itemId The ID of the item to delete.
   * @returns A Promise that resolves when the item is deleted.
   */
  async deleteListItem(
    userId: string,
    listType: 'notToDoList' | 'contextItems' | 'toDoList',
    itemId: number
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as AppState;
        const updatedList = currentData[listType].filter(item => item.id !== itemId);
        await updateDoc(userDocRef, { [listType]: updatedList });
      } else {
        throw new FirebaseServiceError(
          `User document not found for ID: ${userId} when trying to delete item.`,
          null
        );
      }
    } catch (error: unknown) {
      // If error is already a FirebaseServiceError, rethrow it. Otherwise, wrap it.
      if (error instanceof FirebaseServiceError) throw error;
      throw new FirebaseServiceError(
        `Failed to delete item from ${listType} for user ID: ${userId}.`,
        error
      );
    }
  }

  /**
   * Updates the text of an item in 'notToDoList', 'contextItems', or 'toDoList'.
   * This operation reads the current list, maps to update the specific item, and writes the modified list back.
   * @param userId The UID of the current user.
   * @param listType The name of the list to update.
   * @param itemId The ID of the item to update.
   * @param updatedText The new text for the item.
   * @returns A Promise that resolves when the item is updated.
   */
  async updateListItemText(
    userId: string,
    listType: 'notToDoList' | 'contextItems' | 'toDoList', // 'toDoList' added
    itemId: number,
    updatedText: string
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as AppState;
        const updatedList = currentData[listType].map(item =>
          item.id === itemId ? { ...item, text: updatedText } : item
        );
        await updateDoc(userDocRef, { [listType]: updatedList });
      } else {
        throw new FirebaseServiceError(
          `User document not found for ID: ${userId} when trying to update item text.`,
          null
        );
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseServiceError) throw error;
      throw new FirebaseServiceError(
        `Failed to update item text in ${listType} for user ID: ${userId}.`,
        error
      );
    }
  }

  /**
   * Toggles the completion status of a specific To-Do item.
   * This operation reads the current list, maps to update the specific item, and writes the modified list back.
   * @param userId The UID of the current user.
   * @param itemId The ID of the To-Do item to toggle.
   * @param completed The new completion status.
   * @returns A Promise that resolves when the item is updated.
   */
  async toggleTodoItemCompletion(
    userId: string,
    itemId: number,
    completed: boolean
  ): Promise<void> {
    const userDocRef = doc(this.db, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data() as AppState;
        const updatedToDoList = currentData.toDoList.map(item =>
          item.id === itemId ? { ...item, completed: completed } : item
        );
        await updateDoc(userDocRef, { toDoList: updatedToDoList });
      } else {
        throw new FirebaseServiceError(
          `User document not found for ID: ${userId} when trying to toggle todo item completion.`,
          null
        );
      }
    } catch (error: unknown) {
      if (error instanceof FirebaseServiceError) throw error;
      throw new FirebaseServiceError(
        `Failed to toggle todo item completion for user ID: ${userId}.`,
        error
      );
    }
  }
}

export const firebaseService = new FirebaseService();
