// app/store/useStopwatchStore.ts
import * as stopwatchService from '@/services/stopwatchService';
import { StopwatchSession } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface StopwatchState {
  // --- STATE ---
  isRunning: boolean;
  isPreparing: boolean; // True when setting label, before countdown starts
  isBreak: boolean; // True if the current session is a break
  isSaving: boolean;
  duration: number; // Total duration of the timer in ms
  remainingTime: number; // Time left in ms
  sessionLabel: string;
  startTime: number; // Timestamp when the timer started

  // --- ACTIONS ---
  setTimer: (minutes: number, label: string, isBreakSession: boolean) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  saveSession: (isFinished: boolean) => Promise<void>;
  setSessionLabel: (label: string) => void;
}

let timerInterval: number | null = null;

export const useStopwatchStore = create<StopwatchState>((set, get) => ({
  // --- INITIAL STATE ---
  isRunning: false,
  isPreparing: false,
  isBreak: false,
  isSaving: false,
  duration: 0,
  remainingTime: 0,
  sessionLabel: '',
  startTime: 0,

  // --- ACTION IMPLEMENTATIONS ---

  /** Updates the label for the current session. */
  setSessionLabel: label => set({ sessionLabel: label }),

  /** Sets up a new timer session but doesn't start it. */
  setTimer: (minutes, label, isBreakSession) => {
    if (timerInterval) clearInterval(timerInterval);
    const durationMs = minutes * 60 * 1000;
    set({
      duration: durationMs,
      remainingTime: durationMs,
      sessionLabel: label,
      isBreak: isBreakSession,
      isRunning: false,
      isPreparing: true, // Enter preparation mode
    });
  },

  /** Starts or resumes the countdown. */
  startTimer: () => {
    if (get().isRunning || get().remainingTime <= 0) return;

    const endTime = Date.now() + get().remainingTime;
    set({ isRunning: true, isPreparing: false, startTime: Date.now() });

    timerInterval = window.setInterval(() => {
      const newRemainingTime = endTime - Date.now();
      if (newRemainingTime <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        set({ remainingTime: 0, isRunning: false });
        // Automatically save if it was a finished focus session
        if (!get().isBreak) {
          get().saveSession(true);
        } else {
          // If it's a break, just show a notification and reset
          useNotificationStore.getState().showToast('Break finished! Time to focus.', 'info');
          get().resetTimer();
        }
      } else {
        set({ remainingTime: newRemainingTime });
      }
    }, 45); // Update frequently for smooth centiseconds
  },

  /** Pauses the countdown. */
  pauseTimer: () => {
    if (timerInterval) clearInterval(timerInterval);
    set({ isRunning: false });
  },

  /** Resets the timer to its initial state or cancels preparation. */
  resetTimer: () => {
    if (timerInterval) clearInterval(timerInterval);
    set({
      isRunning: false,
      isPreparing: false,
      isBreak: false,
      duration: 0,
      remainingTime: 0,
      sessionLabel: '',
    });
  },

  /** Saves the completed stopwatch session. */
  saveSession: async isFinished => {
    const { sessionLabel, duration, remainingTime, startTime, isBreak } = get();
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    const showToast = useNotificationStore.getState().showToast;

    if (isBreak) {
      get().resetTimer();
      showToast('Session cancelled.', 'info');
      return;
    }

    if (!currentUser || !activeGoalId || !sessionLabel.trim()) {
      showToast('Cannot save: Missing user, active goal, or label.', 'error');
      get().resetTimer();
      return;
    }

    set({ isSaving: true });

    const timeConsumed = isFinished ? duration : duration - remainingTime;

    // Don't save sessions less than a few seconds long
    if (timeConsumed < 5000) {
      set({ isSaving: false });
      get().resetTimer();
      showToast('Session too short to save.', 'info');
      return;
    }

    const newSessionData: Omit<StopwatchSession, 'id' | 'createdAt' | 'updatedAt'> = {
      label: sessionLabel.trim(),
      duration: timeConsumed,
      startTime: Timestamp.fromMillis(startTime),
    };

    try {
      await stopwatchService.addStopwatchSession(currentUser.uid, activeGoalId, newSessionData);
      showToast('Focus session saved!', 'success');
      await useAuthStore.getState().fetchInitialData(currentUser);
    } catch (error) {
      console.error('Failed to save session', error);
      showToast('Failed to save focus session.', 'error');
    } finally {
      set({ isSaving: false });
      get().resetTimer();
    }
  },
}));
