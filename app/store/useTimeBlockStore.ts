// app/store/useTimeBlockStore.ts
import * as timeBlockService from '@/services/timeBlockService';
import { TimeBlock } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface TimeBlockStore {
  addTimeBlock: (label: string, startTime: string, endTime: string, color: string) => Promise<void>;
  updateTimeBlock: (blockId: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (blockId: string) => Promise<void>;
}

export const useTimeBlockStore = create<TimeBlockStore>(() => ({
  addTimeBlock: async (label: string, startTime: string, endTime: string, color: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    try {
      const newTimeBlock = await timeBlockService.addTimeBlock(
        currentUser.uid,
        activeGoalId,
        label,
        startTime,
        endTime,
        color
      );

      useGoalStore.setState(state => {
        const goal = state.appState!.goals[activeGoalId];
        const updatedTimeBlocks = [...(goal.timeBlocks || []), newTimeBlock];
        const updatedGoal = { ...goal, timeBlocks: updatedTimeBlocks };
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
    } catch (error) {
      console.error('Store: Failed to add time block', error);
      useNotificationStore.getState().showToast('Could not add time block.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  updateTimeBlock: async (blockId: string, updates: Partial<TimeBlock>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedTimeBlocks = (goal.timeBlocks || []).map(block =>
        block.id === blockId ? { ...block, ...updates, updatedAt: Timestamp.now() } : block
      );
      const updatedGoal = { ...goal, timeBlocks: updatedTimeBlocks };
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
      await timeBlockService.updateTimeBlock(currentUser.uid, activeGoalId, blockId, updates);
    } catch (error) {
      console.error('Store: Failed to update time block', error);
      useNotificationStore.getState().showToast('Failed to update time block. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteTimeBlock: async (blockId: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedTimeBlocks = (goal.timeBlocks || []).filter(block => block.id !== blockId);
      const updatedGoal = { ...goal, timeBlocks: updatedTimeBlocks };
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
      await timeBlockService.deleteTimeBlock(currentUser.uid, activeGoalId, blockId);
    } catch (error) {
      console.error('Store: Failed to delete time block', error);
      useNotificationStore.getState().showToast('Failed to delete time block. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
