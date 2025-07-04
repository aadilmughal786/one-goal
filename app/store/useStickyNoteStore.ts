// app/store/useStickyNoteStore.ts
import * as stickyNoteService from '@/services/stickyNoteService';
import { StickyNote, StickyNoteColor } from '@/types';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface StickyNoteStore {
  addStickyNote: (title: string, content: string, color: StickyNoteColor) => Promise<void>;
  updateStickyNote: (itemId: string, updates: Partial<StickyNote>) => Promise<void>;
  deleteStickyNote: (itemId: string) => Promise<void>;
}

export const useStickyNoteStore = create<StickyNoteStore>(() => ({
  addStickyNote: async (title: string, content: string, color: StickyNoteColor) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    try {
      const newItem = await stickyNoteService.addStickyNote(
        currentUser.uid,
        activeGoalId,
        title,
        content,
        color
      );
      useGoalStore.setState(state => {
        const goal = state.appState!.goals[activeGoalId];
        return {
          appState: {
            ...state.appState!,
            goals: {
              ...state.appState!.goals,
              [activeGoalId]: { ...goal, stickyNotes: [...(goal.stickyNotes || []), newItem] },
            },
          },
        };
      });
    } catch (error) {
      console.error('Store: Failed to add sticky note', error);
      useNotificationStore.getState().showToast('Could not add sticky note.', 'error');
    }
  },
  updateStickyNote: async (itemId: string, updates: Partial<StickyNote>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = (goal.stickyNotes || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, stickyNotes: updatedList },
          },
        },
      };
    });
    try {
      await stickyNoteService.updateStickyNote(currentUser.uid, activeGoalId, itemId, updates);
    } catch (error) {
      console.error('Store: Failed to update sticky note', error);
      useNotificationStore
        .getState()
        .showToast('Failed to update sticky note. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteStickyNote: async (itemId: string) => {
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
            [activeGoalId]: {
              ...goal,
              stickyNotes: (goal.stickyNotes || []).filter(n => n.id !== itemId),
            },
          },
        },
      };
    });
    try {
      await stickyNoteService.deleteStickyNote(currentUser.uid, activeGoalId, itemId);
    } catch (error) {
      console.error('Store: Failed to delete sticky note', error);
      useNotificationStore
        .getState()
        .showToast('Failed to delete sticky note. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
