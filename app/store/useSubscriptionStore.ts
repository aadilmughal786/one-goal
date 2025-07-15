// app/store/useSubscriptionStore.ts
import * as subscriptionService from '@/services/subscriptionService';
import { Subscription } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface SubscriptionStore {
  addSubscription: (
    newSubscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateSubscription: (
    subscriptionId: string,
    updates: Partial<Omit<Subscription, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteSubscription: (subscriptionId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>(() => ({
  addSubscription: async newSubscriptionData => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newSubscription = await subscriptionService.addSubscription(
        currentUser.uid,
        activeGoalId,
        newSubscriptionData
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
                  subscriptions: [...financeData.subscriptions, newSubscription],
                },
              },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Subscription added successfully!', 'success');
    } catch (error) {
      console.error('Store: Failed to add subscription', error);
      useNotificationStore.getState().showToast('Could not add subscription.', 'error');
    }
  },

  updateSubscription: async (subscriptionId, updates) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedSubscriptions = financeData.subscriptions.map(s =>
        s.id === subscriptionId ? { ...s, ...updates } : s
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, subscriptions: updatedSubscriptions },
            },
          },
        },
      };
    });

    try {
      await subscriptionService.updateSubscription(
        currentUser.uid,
        activeGoalId,
        subscriptionId,
        updates
      );
      useNotificationStore.getState().showToast('Subscription updated.', 'success');
    } catch (error) {
      console.error('Store: Failed to update subscription', error);
      useNotificationStore
        .getState()
        .showToast('Failed to update subscription. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  deleteSubscription: async subscriptionId => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedSubscriptions = financeData.subscriptions.filter(s => s.id !== subscriptionId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, subscriptions: updatedSubscriptions },
            },
          },
        },
      };
    });

    try {
      await subscriptionService.deleteSubscription(currentUser.uid, activeGoalId, subscriptionId);
      useNotificationStore.getState().showToast('Subscription deleted.', 'info');
    } catch (error) {
      console.error('Store: Failed to delete subscription', error);
      useNotificationStore
        .getState()
        .showToast('Failed to delete subscription. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
