// app/store/useTransactionStore.ts
import * as transactionService from '@/services/transactionService';
import { Transaction } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface TransactionStore {
  addTransaction: (
    newTransactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateTransaction: (
    transactionId: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>(() => ({
  addTransaction: async newTransactionData => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newTransaction = await transactionService.addTransaction(
        currentUser.uid,
        activeGoalId,
        newTransactionData
      );
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
                financeData: {
                  ...financeData,
                  transactions: [...financeData.transactions, newTransaction],
                },
              },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Transaction added successfully!', 'success');
    } catch (error) {
      console.error('Store: Failed to add transaction', error);
      useNotificationStore.getState().showToast('Could not add transaction.', 'error');
    }
  },

  updateTransaction: async (transactionId, updates) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedTransactions = financeData.transactions.map(t =>
        t.id === transactionId ? { ...t, ...updates } : t
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, transactions: updatedTransactions },
            },
          },
        },
      };
    });

    try {
      await transactionService.updateTransaction(
        currentUser.uid,
        activeGoalId,
        transactionId,
        updates
      );
      useNotificationStore.getState().showToast('Transaction updated.', 'success');
    } catch (error) {
      console.error('Store: Failed to update transaction', error);
      useNotificationStore
        .getState()
        .showToast('Failed to update transaction. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  deleteTransaction: async transactionId => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedTransactions = financeData.transactions.filter(t => t.id !== transactionId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, transactions: updatedTransactions },
            },
          },
        },
      };
    });

    try {
      await transactionService.deleteTransaction(currentUser.uid, activeGoalId, transactionId);
      useNotificationStore.getState().showToast('Transaction deleted.', 'info');
    } catch (error) {
      console.error('Store: Failed to delete transaction', error);
      useNotificationStore
        .getState()
        .showToast('Failed to delete transaction. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
