// app/store/useQuoteStore.ts
import * as quoteService from '@/services/quoteService';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface QuoteStore {
  addStarredQuote: (quoteId: number) => Promise<void>;
  removeStarredQuote: (quoteId: number) => Promise<void>;
}

export const useQuoteStore = create<QuoteStore>(() => ({
  addStarredQuote: async (quoteId: number) => {
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
            [activeGoalId]: { ...goal, starredQuotes: [...goal.starredQuotes, quoteId] },
          },
        },
      };
    });
    try {
      await quoteService.addStarredQuote(currentUser.uid, activeGoalId, quoteId);
    } catch (error) {
      console.error('Store: Failed to star quote', error);
      useNotificationStore.getState().showToast('Failed to star quote. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  removeStarredQuote: async (quoteId: number) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.starredQuotes.filter(id => id !== quoteId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, starredQuotes: updatedList },
          },
        },
      };
    });
    try {
      await quoteService.removeStarredQuote(currentUser.uid, activeGoalId, quoteId);
    } catch (error) {
      console.error('Store: Failed to unstar quote', error);
      useNotificationStore.getState().showToast('Failed to unstar quote. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
