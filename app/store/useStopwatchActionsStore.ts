// app/store/useStopwatchActionsStore.ts
import * as stopwatchService from '@/services/stopwatchService';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';
import { StopwatchSession, SatisfactionLevel, RoutineType, RoutineLogStatus } from '@/types';

interface StopwatchActionsStore {
  updateStopwatchSession: (dateKey: string, sessionId: string, newLabel: string) => Promise<void>;
  deleteStopwatchSession: (dateKey: string, sessionId: string) => Promise<void>;
  addStopwatchSessionToGoal: (goalId: string, newSession: StopwatchSession) => void;
  removeStopwatchSessionFromGoal: (goalId: string, sessionId: string) => void;
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

  addStopwatchSessionToGoal: (goalId, newSession) => {
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[goalId];
      const dateKey = newSession.startTime.toDate().toISOString().split('T')[0]; // yyyy-MM-dd

      const existingProgress = goal.dailyProgress[dateKey];

      const updatedDailyProgress = existingProgress
        ? { ...existingProgress, sessions: [...existingProgress.sessions, newSession] }
        : {
            date: dateKey,
            satisfaction: SatisfactionLevel.NEUTRAL,
            notes: '',
            routines: {
              [RoutineType.SLEEP]: RoutineLogStatus.NOT_LOGGED,
              [RoutineType.WATER]: RoutineLogStatus.NOT_LOGGED,
              [RoutineType.TEETH]: RoutineLogStatus.NOT_LOGGED,
              [RoutineType.MEAL]: RoutineLogStatus.NOT_LOGGED,
              [RoutineType.BATH]: RoutineLogStatus.NOT_LOGGED,
              [RoutineType.EXERCISE]: RoutineLogStatus.NOT_LOGGED,
            },
            sessions: [newSession],
            totalSessionDuration: 0, // This will be recalculated by the service on actual save
            weight: null,
          };

      // Recalculate totalSessionDuration for optimistic update
      updatedDailyProgress.totalSessionDuration = updatedDailyProgress.sessions.reduce(
        (sum, session) => sum + session.duration,
        0
      );

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [goalId]: {
              ...goal,
              dailyProgress: {
                ...goal.dailyProgress,
                [dateKey]: updatedDailyProgress,
              },
            },
          },
        },
      };
    });
  },
  removeStopwatchSessionFromGoal: (goalId, sessionId) => {
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[goalId];
      if (!goal) return state;

      let updatedDailyProgress = { ...goal.dailyProgress };
      let sessionFound = false;

      for (const dateKey in updatedDailyProgress) {
        const progress = updatedDailyProgress[dateKey];
        const updatedSessions = progress.sessions.filter(session => session.id !== sessionId);

        if (updatedSessions.length < progress.sessions.length) {
          // Session found and removed
          sessionFound = true;
          const newTotalDuration = updatedSessions.reduce(
            (sum, session) => sum + session.duration,
            0
          );
          updatedDailyProgress = {
            ...updatedDailyProgress,
            [dateKey]: {
              ...progress,
              sessions: updatedSessions,
              totalSessionDuration: newTotalDuration,
            },
          };
          break; // Assuming session IDs are unique across all dailyProgress entries for a goal
        }
      }

      if (!sessionFound) return state; // No session removed, return original state

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [goalId]: {
              ...goal,
              dailyProgress: updatedDailyProgress,
            },
          },
        },
      };
    });
  },
}));
