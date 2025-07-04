// app/store/useRoutineStore.ts
import * as routineService from '@/services/routineService';
import {
  DailyProgress,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  UserRoutineSettings,
} from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface RoutineStore {
  updateRoutineSettings: (newSettings: UserRoutineSettings) => Promise<void>;
  saveDailyProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
}

export const useRoutineStore = create<RoutineStore>(() => ({
  updateRoutineSettings: async (newSettings: UserRoutineSettings) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, routineSettings: newSettings },
          },
        },
      };
    });
    try {
      await routineService.updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
    } catch (error) {
      console.error('Store: Failed to update routines', error);
      useNotificationStore.getState().showToast('Failed to update routines. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  saveDailyProgress: async (progressData: Partial<DailyProgress>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId || !progressData.date) return;

    const dateKey = progressData.date;
    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const existingProgress = goal.dailyProgress[dateKey] || {
        date: dateKey,
        satisfaction: SatisfactionLevel.NEUTRAL,
        notes: '',
        sessions: [],
        totalSessionDuration: 0,
        routines: {
          [RoutineType.SLEEP]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.WATER]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.TEETH]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.MEAL]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.BATH]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.EXERCISE]: RoutineLogStatus.NOT_LOGGED,
        },
        weight: null,
      };

      const updatedDailyData: DailyProgress = {
        ...existingProgress,
        ...progressData,
      };

      const updatedProgressMap = { ...goal.dailyProgress, [dateKey]: updatedDailyData };

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, dailyProgress: updatedProgressMap },
          },
        },
      };
    });

    try {
      const finalProgressDataForFirebase =
        useGoalStore.getState().appState!.goals[activeGoalId].dailyProgress[dateKey];
      await routineService.saveDailyProgress(
        currentUser.uid,
        activeGoalId,
        finalProgressDataForFirebase
      );
    } catch (error) {
      console.error('Store: Failed to save progress', error);
      useNotificationStore.getState().showToast('Failed to save progress. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
