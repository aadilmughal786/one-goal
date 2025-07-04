// app/store/useDistractionStore.ts
import * as distractionService from '@/services/distractionService';
import { DistractionItem } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface DistractionStore {
  addDistraction: (title: string) => Promise<void>;
  updateDistraction: (itemId: string, updates: Partial<DistractionItem>) => Promise<void>;
  deleteDistraction: (itemId: string) => Promise<void>;
}

export const useDistractionStore = create<DistractionStore>(() => ({
  addDistraction: async (title: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    try {
      const newItem = await distractionService.addDistractionItem(
        currentUser.uid,
        activeGoalId,
        title
      );
      useGoalStore.setState(state => {
        const goal = state.appState!.goals[activeGoalId];
        return {
          appState: {
            ...state.appState!,
            goals: {
              ...state.appState!.goals,
              [activeGoalId]: { ...goal, notToDoList: [...goal.notToDoList, newItem] },
            },
          },
        };
      });
    } catch (error) {
      console.error('Store: Failed to add distraction', error);
      useNotificationStore.getState().showToast('Could not add distraction.', 'error');
    }
  },
  updateDistraction: async (itemId: string, updates: Partial<DistractionItem>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.notToDoList.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, notToDoList: updatedList },
          },
        },
      };
    });
    try {
      await distractionService.updateDistractionItem(
        currentUser.uid,
        activeGoalId,
        itemId,
        updates
      );
    } catch (error) {
      console.error('Store: Failed to update distraction', error);
      useNotificationStore
        .getState()
        .showToast('Failed to update distraction. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteDistraction: async (itemId: string) => {
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
            [activeGoalId]: { ...goal, notToDoList: goal.notToDoList.filter(i => i.id !== itemId) },
          },
        },
      };
    });
    try {
      await distractionService.deleteDistractionItem(currentUser.uid, activeGoalId, itemId);
    } catch (error) {
      console.error('Store: Failed to delete distraction', error);
      useNotificationStore
        .getState()
        .showToast('Failed to delete distraction. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
