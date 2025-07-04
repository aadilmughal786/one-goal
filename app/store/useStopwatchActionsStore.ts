// app/store/useStopwatchActionsStore.ts
import * as stopwatchService from '@/services/stopwatchService';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface StopwatchActionsStore {
  updateStopwatchSession: (dateKey: string, sessionId: string, newLabel: string) => Promise<void>;
  deleteStopwatchSession: (dateKey: string, sessionId: string) => Promise<void>;
}

export const useStopwatchActionsStore = create<StopwatchActionsStore>(() => ({
  updateStopwatchSession: async (dateKey, sessionId, newLabel) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const progress = goal.dailyProgress[dateKey];
      if (!progress) return state;

      const updatedSessions = progress.sessions.map(session =>
        session.id === sessionId
          ? { ...session, label: newLabel, updatedAt: Timestamp.now() }
          : session
      );

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              dailyProgress: {
                ...goal.dailyProgress,
                [dateKey]: { ...progress, sessions: updatedSessions },
              },
            },
          },
        },
      };
    });

    try {
      await stopwatchService.updateStopwatchSession(
        currentUser.uid,
        activeGoalId,
        dateKey,
        sessionId,
        newLabel
      );
    } catch (error) {
      console.error('Store: Failed to update stopwatch session', error);
      useNotificationStore.getState().showToast('Failed to update session. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteStopwatchSession: async (dateKey, sessionId) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const progress = goal.dailyProgress[dateKey];
      if (!progress) return state;

      const updatedSessions = progress.sessions.filter(session => session.id !== sessionId);
      const newTotalDuration = updatedSessions.reduce((sum, session) => sum + session.duration, 0);

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              dailyProgress: {
                ...goal.dailyProgress,
                [dateKey]: {
                  ...progress,
                  sessions: updatedSessions,
                  totalSessionDuration: newTotalDuration,
                },
              },
            },
          },
        },
      };
    });

    try {
      await stopwatchService.deleteStopwatchSession(
        currentUser.uid,
        activeGoalId,
        dateKey,
        sessionId
      );
    } catch (error) {
      console.error('Store: Failed to delete stopwatch session', error);
      useNotificationStore.getState().showToast('Failed to delete session. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
