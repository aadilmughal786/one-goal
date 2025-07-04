// app/store/useResourceStore.ts
import * as resourceService from '@/services/resourceService';
import { Resource, ResourceType } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface ResourceStore {
  addResource: (url: string, title: string, type: ResourceType) => Promise<void>;
  updateResource: (resourceId: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
}

export const useResourceStore = create<ResourceStore>(() => ({
  addResource: async (url: string, title: string, type: ResourceType) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newResource = await resourceService.addResource(
        currentUser.uid,
        activeGoalId,
        url,
        title,
        type
      );
      useGoalStore.setState(state => {
        const goal = state.appState!.goals[activeGoalId];
        const updatedResources = [...(goal.resources || []), newResource];
        return {
          appState: {
            ...state.appState!,
            goals: {
              ...state.appState!.goals,
              [activeGoalId]: { ...goal, resources: updatedResources },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Resource added!', 'success');
    } catch (error) {
      console.error('Store: Failed to add resource', error);
      useNotificationStore.getState().showToast('Could not add resource.', 'error');
    }
  },
  updateResource: async (resourceId: string, updates: Partial<Resource>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedResources = (goal.resources || []).map(r =>
        r.id === resourceId ? { ...r, ...updates } : r
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, resources: updatedResources },
          },
        },
      };
    });

    try {
      await resourceService.updateResource(currentUser.uid, activeGoalId, resourceId, updates);
      useNotificationStore.getState().showToast('Resource updated.', 'success');
    } catch (error) {
      console.error('Store: Failed to update resource', error);
      useNotificationStore.getState().showToast('Failed to update resource. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteResource: async (resourceId: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };

    useGoalStore.setState(state => {
      if (!state.appState) return {};
      const goal = state.appState.goals[activeGoalId];
      const updatedResources = (goal.resources || []).filter(r => r.id !== resourceId);
      return {
        appState: {
          ...state.appState,
          goals: {
            ...state.appState.goals,
            [activeGoalId]: { ...goal, resources: updatedResources },
          },
        },
      };
    });

    try {
      await resourceService.deleteResource(currentUser.uid, activeGoalId, resourceId);
      useNotificationStore.getState().showToast('Resource deleted.', 'info');
    } catch (error) {
      console.error('Store: Failed to delete resource', error);
      useNotificationStore.getState().showToast('Failed to delete resource. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
