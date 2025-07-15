// app/store/useBudgetStore.ts
import * as budgetService from '@/services/budgetService';
import { Budget } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface BudgetStore {
  addBudget: (newBudgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (
    budgetId: string,
    updates: Partial<Omit<Budget, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>(() => ({
  addBudget: async newBudgetData => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newBudget = await budgetService.addBudget(currentUser.uid, activeGoalId, newBudgetData);
      useGoalStore.setState(state => {
        const goal = state.appState!.goals[activeGoalId];
        const financeData = goal.financeData!;
        return {
          appState: {
            ...state.appState!,
            goals: {
              ...state.appState!.goals,
              [activeGoalId]: {
                ...goal,
                financeData: { ...financeData, budgets: [...financeData.budgets, newBudget] },
              },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Budget created successfully!', 'success');
    } catch (error) {
      console.error('Store: Failed to add budget', error);
      useNotificationStore.getState().showToast('Could not create budget.', 'error');
    }
  },

  updateBudget: async (budgetId, updates) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedBudgets = financeData.budgets.map(b =>
        b.id === budgetId ? { ...b, ...updates } : b
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, budgets: updatedBudgets },
            },
          },
        },
      };
    });

    try {
      await budgetService.updateBudget(currentUser.uid, activeGoalId, budgetId, updates);
      useNotificationStore.getState().showToast('Budget updated.', 'success');
    } catch (error) {
      console.error('Store: Failed to update budget', error);
      useNotificationStore.getState().showToast('Failed to update budget. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  deleteBudget: async budgetId => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedBudgets = financeData.budgets.filter(b => b.id !== budgetId);
      const updatedTransactions = financeData.transactions.filter(t => t.budgetId !== budgetId);
      const updatedSubscriptions = financeData.subscriptions.filter(s => s.budgetId !== budgetId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: {
                ...financeData,
                budgets: updatedBudgets,
                transactions: updatedTransactions,
                subscriptions: updatedSubscriptions,
              },
            },
          },
        },
      };
    });

    try {
      await budgetService.deleteBudget(currentUser.uid, activeGoalId, budgetId);
      useNotificationStore.getState().showToast('Budget and related items deleted.', 'info');
    } catch (error) {
      console.error('Store: Failed to delete budget', error);
      useNotificationStore.getState().showToast('Failed to delete budget. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
