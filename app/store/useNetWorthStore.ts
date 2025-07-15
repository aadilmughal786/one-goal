// app/store/useNetWorthStore.ts
import * as netWorthService from '@/services/netWorthService';
import { Asset, Liability } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface NetWorthStore {
  addAsset: (newAssetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAsset: (
    assetId: string,
    updates: Partial<Omit<Asset, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  addLiability: (
    newLiabilityData: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateLiability: (
    liabilityId: string,
    updates: Partial<Omit<Liability, 'id' | 'createdAt'>>
  ) => Promise<void>;
  deleteLiability: (liabilityId: string) => Promise<void>;
}

export const useNetWorthStore = create<NetWorthStore>(() => ({
  // --- ASSET ACTIONS ---
  addAsset: async newAssetData => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newAsset = await netWorthService.addAsset(currentUser.uid, activeGoalId, newAssetData);
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
                financeData: { ...financeData, assets: [...financeData.assets, newAsset] },
              },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Asset added!', 'success');
    } catch (error) {
      console.error('Store: Failed to add asset', error);
      useNotificationStore.getState().showToast('Could not add asset.', 'error');
    }
  },

  updateAsset: async (assetId, updates) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedAssets = financeData.assets.map(a =>
        a.id === assetId ? { ...a, ...updates } : a
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, assets: updatedAssets },
            },
          },
        },
      };
    });

    try {
      await netWorthService.updateAsset(currentUser.uid, activeGoalId, assetId, updates);
      useNotificationStore.getState().showToast('Asset updated.', 'success');
    } catch (error) {
      console.error('Store: Failed to update asset', error);
      useNotificationStore.getState().showToast('Failed to update asset. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  deleteAsset: async assetId => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedAssets = financeData.assets.filter(a => a.id !== assetId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, assets: updatedAssets },
            },
          },
        },
      };
    });

    try {
      await netWorthService.deleteAsset(currentUser.uid, activeGoalId, assetId);
      useNotificationStore.getState().showToast('Asset deleted.', 'info');
    } catch (error) {
      console.error('Store: Failed to delete asset', error);
      useNotificationStore.getState().showToast('Failed to delete asset. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  // --- LIABILITY ACTIONS ---
  addLiability: async newLiabilityData => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newLiability = await netWorthService.addLiability(
        currentUser.uid,
        activeGoalId,
        newLiabilityData
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
                  liabilities: [...financeData.liabilities, newLiability],
                },
              },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Liability added!', 'success');
    } catch (error) {
      console.error('Store: Failed to add liability', error);
      useNotificationStore.getState().showToast('Could not add liability.', 'error');
    }
  },

  updateLiability: async (liabilityId, updates) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedLiabilities = financeData.liabilities.map(l =>
        l.id === liabilityId ? { ...l, ...updates } : l
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, liabilities: updatedLiabilities },
            },
          },
        },
      };
    });

    try {
      await netWorthService.updateLiability(currentUser.uid, activeGoalId, liabilityId, updates);
      useNotificationStore.getState().showToast('Liability updated.', 'success');
    } catch (error) {
      console.error('Store: Failed to update liability', error);
      useNotificationStore.getState().showToast('Failed to update liability. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  deleteLiability: async liabilityId => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const financeData = goal.financeData!;
      const updatedLiabilities = financeData.liabilities.filter(l => l.id !== liabilityId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              financeData: { ...financeData, liabilities: updatedLiabilities },
            },
          },
        },
      };
    });

    try {
      await netWorthService.deleteLiability(currentUser.uid, activeGoalId, liabilityId);
      useNotificationStore.getState().showToast('Liability deleted.', 'info');
    } catch (error) {
      console.error('Store: Failed to delete liability', error);
      useNotificationStore.getState().showToast('Failed to delete liability. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
