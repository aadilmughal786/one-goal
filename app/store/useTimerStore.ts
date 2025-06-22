// app/store/useTimerStore.ts
import { StopwatchSession } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';

// We need to import the new stopwatchService and the main goal store
import { addStopwatchSession } from '@/services/stopwatchService';
import { useGoalStore } from './useGoalStore'; // To get currentUser and activeGoalId
// NEW: Import useNotificationStore to trigger toasts
import { useNotificationStore } from './useNotificationStore';

/**
 * @file app/store/useTimerStore.ts
 * @description Zustand store for managing the global stopwatch state.
 *
 * This store encapsulates all logic for the application's stopwatch, including
 * its running state, elapsed time, and the process of labeling and saving sessions.
 * This replaces the old TimerProvider and allows any component to interact with the timer.
 */

/**
 * Defines the shape of the timer store's state and actions.
 */
interface TimerState {
  // --- STATE ---
  isRunning: boolean;
  isLabeling: boolean;
  isSaving: boolean;
  elapsedTime: number; // in milliseconds
  sessionLabel: string;
  startTime: number; // The timestamp when the timer was started (or resumed)

  // --- ACTIONS ---
  start: () => void;
  pause: () => void;
  reset: () => void;
  save: () => Promise<void>;
  setSessionLabel: (label: string) => void;
}

// A simple interval variable outside the store to hold the timer ID.
let timerInterval: number | null = null;

/**
 * The Zustand store for managing the global stopwatch.
 */
export const useTimerStore = create<TimerState>((set, get) => ({
  // --- INITIAL STATE ---
  isRunning: false,
  isLabeling: false,
  isSaving: false,
  elapsedTime: 0,
  sessionLabel: '',
  startTime: 0,

  // --- ACTION IMPLEMENTATIONS ---

  /** Updates the label for the current session. */
  setSessionLabel: label => set({ sessionLabel: label }),

  /** Starts or resumes the stopwatch. */
  start: () => {
    // Prevent starting if it's already running.
    if (get().isRunning) return;

    // Use a simple, efficient interval to update the elapsed time.
    // This logic is now completely decoupled from any React component's lifecycle.
    timerInterval = window.setInterval(() => {
      set(state => ({ elapsedTime: Date.now() - state.startTime }));
    }, 45); // Update ~22 times per second for a smooth display.

    set({ isRunning: true, startTime: Date.now() - get().elapsedTime });
  },

  /** Pauses the stopwatch. */
  pause: () => {
    if (timerInterval) clearInterval(timerInterval);
    set({ isRunning: false });
  },

  /** Resets the stopwatch or enters labeling mode if time has elapsed. */
  reset: () => {
    const { elapsedTime, isLabeling } = get();
    // If the timer has run and we are not already in labeling mode...
    if (elapsedTime > 0 && !isLabeling) {
      // ...pause the timer and enter labeling mode.
      get().pause();
      set({ isLabeling: true });
    } else {
      // Otherwise, perform a full reset.
      if (timerInterval) clearInterval(timerInterval);
      set({ isRunning: false, isLabeling: false, elapsedTime: 0, sessionLabel: '' });
    }
  },

  /** Saves the completed stopwatch session to Firestore. */
  save: async () => {
    const { sessionLabel, elapsedTime, startTime } = get();
    // Get the current user and active goal from the main goal store.
    const { currentUser, appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;

    // NEW: Access showToast from the useNotificationStore
    const showToast = useNotificationStore.getState().showToast;

    if (!currentUser || !activeGoalId || !sessionLabel.trim()) {
      console.error('Cannot save session: Missing user, active goal, or label.');
      // Trigger a toast notification here.
      showToast('Cannot save session: Missing user, active goal, or label.', 'error');
      return;
    }

    set({ isSaving: true });

    const newSessionData: Omit<StopwatchSession, 'id' | 'createdAt' | 'updatedAt'> = {
      label: sessionLabel.trim(),
      duration: elapsedTime,
      startTime: Timestamp.fromMillis(startTime),
    };

    try {
      await addStopwatchSession(currentUser.uid, activeGoalId, newSessionData);
      // Perform a full reset of the timer state after a successful save.
      get().reset();
      showToast('Focus session saved successfully!', 'success'); // Success toast
    } catch (error) {
      console.error('Failed to save session', error);
      // Trigger an error toast here.
      showToast('Failed to save focus session.', 'error');
    } finally {
      set({ isSaving: false, isLabeling: false });
    }
  },
}));
