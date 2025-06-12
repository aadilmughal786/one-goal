// src/services/localStorageService.ts

import { AppState, AppMode } from '@/types'; // Import AppMode and the updated AppState
import { LocalStorageError } from '@/utils/errors'; // Import custom error

const LOCAL_STORAGE_KEY = 'oneGoalGuestData';
const LOCAL_STORAGE_APP_MODE_KEY = 'oneGoalAppMode'; // Key for tracking app mode

/**
 * LocalStorageService class for managing all local storage operations.
 */
class LocalStorageService {
  /**
   * Loads the application state from local storage.
   * @returns The loaded AppState or null if no data is found.
   */
  loadLocalState(): AppState | null {
    if (typeof window === 'undefined') return null; // Ensure running in browser environment
    try {
      const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (serializedState === null) {
        return null;
      }
      const parsedState: AppState = JSON.parse(serializedState);
      return parsedState;
    } catch (error) {
      throw new LocalStorageError(`Error loading state from local storage.`, error);
    }
  }

  /**
   * Saves the provided application state to local storage.
   * @param state The AppState to save.
   */
  saveLocalState(state: AppState): void {
    if (typeof window === 'undefined') return;
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (error) {
      throw new LocalStorageError(`Error saving state to local storage.`, error);
    }
  }

  /**
   * Clears all application data from local storage.
   */
  clearLocalState(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      throw new LocalStorageError(`Error clearing state from local storage.`, error);
    }
  }

  /**
   * Detects if there is any guest data stored in local storage.
   * This function serves as the guest detection mechanism.
   * @returns True if guest data exists, false otherwise.
   * @throws LocalStorageError if access to local storage is denied or an error occurs.
   */
  hasLocalData(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY) !== null;
    } catch (error) {
      // Throw LocalStorageError to be caught by UI for toast message
      throw new LocalStorageError(
        `Access to local storage denied or error occurred when checking for local data.`,
        error
      );
    }
  }

  /**
   * Sets the current application mode in local storage.
   * @param mode The AppMode to set ('guest', 'google', or 'none').
   */
  setAppModeInLocalStorage(mode: AppMode): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_APP_MODE_KEY, mode);
    } catch (error) {
      throw new LocalStorageError(`Error setting app mode in local storage to '${mode}'.`, error);
    }
  }

  /**
   * Gets the current application mode from local storage.
   * It also initializes it to 'none' if not already set or if invalid.
   * @returns The AppMode ('guest', 'google', 'none').
   */
  getAppModeFromLocalStorage(): AppMode {
    if (typeof window === 'undefined') return 'none';
    try {
      const mode = localStorage.getItem(LOCAL_STORAGE_APP_MODE_KEY) as AppMode | null;
      if (mode && ['guest', 'google', 'none'].includes(mode)) {
        return mode;
      }
      // If not set or invalid, initialize to 'none'
      this.setAppModeInLocalStorage('none'); // Use 'this' for class method
      return 'none';
    } catch (error) {
      // If setting 'none' also fails, this will be caught.
      // The error originating from setAppModeInLocalStorage is preferred to be thrown
      // to the caller, rather than logged here.
      throw new LocalStorageError(
        "Error getting app mode from local storage, attempting to initialize to 'none'.",
        error
      );
    }
  }

  /**
   * Clears the application mode from local storage.
   */
  clearAppModeFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_APP_MODE_KEY);
    } catch (error) {
      throw new LocalStorageError(`Error clearing app mode from local storage.`, error);
    }
  }

  /**
   * Initializes the app mode to 'none' if it's not already set.
   * This ensures the appMode variable always has a starting value.
   */
  initializeAppMode(): void {
    if (typeof window === 'undefined') return;
    try {
      const currentMode = localStorage.getItem(LOCAL_STORAGE_APP_MODE_KEY);
      if (currentMode === null) {
        localStorage.setItem(LOCAL_STORAGE_APP_MODE_KEY, 'none');
      }
    } catch (error) {
      throw new LocalStorageError(`Error initializing app mode in local storage.`, error);
    }
  }
}

export const localStorageService = new LocalStorageService();
