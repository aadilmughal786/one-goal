// app/store/useRandomPickerStore.ts
import * as goalService from '@/services/goalService';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface RandomPickerStore {
  updateRandomPickerItems: (items: string[]) => Promise<void>;
}

export const useRandomPickerStore = create<RandomPickerStore>(() => ({
  updateRandomPickerItems: async (items: string[]) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedGoal = { ...goal, randomPickerItems: items };
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: updatedGoal,
          },
        },
      };
    });

    try {
      await goalService.updateGoal(currentUser.uid, activeGoalId, { randomPickerItems: items });
    } catch (error) {
      console.error('Store: Failed to update picker items', error);
      useNotificationStore
        .getState()
        .showToast('Failed to update picker list. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
