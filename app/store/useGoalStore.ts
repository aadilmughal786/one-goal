// app/store/useGoalStore.ts
import {
  AppState,
  DailyProgress,
  DistractionItem,
  Goal,
  GoalStatus,
  StickyNote,
  StickyNoteColor,
  TodoItem,
  UserRoutineSettings,
} from '@/types';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';

// Import all our new service functions
import * as distractionService from '@/services/distractionService';
import * as goalService from '@/services/goalService';
import * as quoteService from '@/services/quoteService';
import * as routineService from '@/services/routineService';
import * as stickyNoteService from '@/services/stickyNoteService';
import * as stopwatchService from '@/services/stopwatchService'; // Import stopwatch service
import * as todoService from '@/services/todoService';

// Import the notification store to show error toasts on failure
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { useNotificationStore } from './useNotificationStore';

/**
 * @file app/store/useGoalStore.ts
 * @description The main Zustand store for the application, now with robust error handling for optimistic updates.
 */
interface GoalStore {
  // --- STATE ---
  appState: AppState | null;
  currentUser: User | null;
  isLoading: boolean;

  // --- ACTIONS ---
  fetchInitialData: (user: User) => Promise<void>;
  createGoal: (name: string, endDate: Date, description: string) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setActiveGoal: (goalId: string | null) => Promise<void>;
  addTodo: (text: string) => Promise<void>;
  updateTodo: (itemId: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (itemId: string) => Promise<void>;
  reorderTodos: (reorderedList: TodoItem[]) => Promise<void>;
  addDistraction: (title: string) => Promise<void>;
  updateDistraction: (itemId: string, updates: Partial<DistractionItem>) => Promise<void>;
  deleteDistraction: (itemId: string) => Promise<void>;
  addStickyNote: (title: string, content: string, color: StickyNoteColor) => Promise<void>;
  updateStickyNote: (itemId: string, updates: Partial<StickyNote>) => Promise<void>;
  deleteStickyNote: (itemId: string) => Promise<void>;
  updateRoutineSettings: (newSettings: UserRoutineSettings) => Promise<void>;
  saveDailyProgress: (progressData: DailyProgress) => Promise<void>;
  addStarredQuote: (quoteId: number) => Promise<void>;
  removeStarredQuote: (quoteId: number) => Promise<void>;
  // FIX: Added missing stopwatch actions to the store interface
  updateStopwatchSession: (dateKey: string, sessionId: string, newLabel: string) => Promise<void>;
  deleteStopwatchSession: (dateKey: string, sessionId: string) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  // --- INITIAL STATE ---
  appState: null,
  currentUser: null,
  isLoading: true,

  // --- ACTION IMPLEMENTATIONS ---

  fetchInitialData: async user => {
    set({ currentUser: user, isLoading: true });
    try {
      const appData = await goalService.getUserData(user.uid);
      set({ appState: appData, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user data:', error);

      let errorMessage = 'Failed to load your data. It may be corrupted.';
      if (error instanceof ServiceError) {
        // Use the detailed, formatted message from the service
        errorMessage = error.message;
      }

      // Show the specific error to the user
      useNotificationStore.getState().showToast(errorMessage, 'error');

      // If the error was a validation failure, reset the data to prevent crashes
      if (error instanceof ServiceError && error.code === ServiceErrorCode.VALIDATION_FAILED) {
        const { currentUser } = get();
        if (currentUser) {
          try {
            const defaultState = await goalService.resetUserData(currentUser.uid);
            set({ appState: defaultState, isLoading: false });
            // Inform the user that a reset has occurred
            useNotificationStore
              .getState()
              .showToast('Your data was incompatible and has been safely reset.', 'info');
          } catch (resetError) {
            console.error('Failed to reset user data after validation failure:', resetError);
            set({ isLoading: false, currentUser: null, appState: null });
          }
        }
      } else {
        set({ isLoading: false, currentUser: null, appState: null });
      }
    }
  },

  createGoal: async (name, endDate, description) => {
    const { currentUser, appState } = get();
    if (!currentUser || !appState) return;

    try {
      const newGoalData = {
        name,
        description,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(endDate),
        status: GoalStatus.ACTIVE,
      };
      const createdGoal = await goalService.createGoal(currentUser.uid, newGoalData);

      set(state => {
        const newAppState: AppState = {
          ...state.appState!,
          goals: { ...state.appState!.goals, [createdGoal.id]: createdGoal },
          activeGoalId: state.appState!.activeGoalId ?? createdGoal.id,
        };
        if (!state.appState!.activeGoalId) {
          goalService.setActiveGoal(currentUser.uid, createdGoal.id);
        }
        return { appState: newAppState };
      });
    } catch (error) {
      console.error('Store: Failed to create goal', error);
      useNotificationStore.getState().showToast('Could not create goal.', 'error');
    }
  },

  updateGoal: async (goalId, updates) => {
    const { currentUser, appState } = get();
    if (!currentUser || !appState) return;
    const originalState = { ...appState };
    set(state => ({
      appState: {
        ...state.appState!,
        goals: {
          ...state.appState!.goals,
          [goalId]: { ...state.appState!.goals[goalId], ...updates },
        },
      },
    }));
    try {
      await goalService.updateGoal(currentUser.uid, goalId, updates);
    } catch (error) {
      console.error('Store: Failed to update goal', error);
      useNotificationStore.getState().showToast('Failed to update goal. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  deleteGoal: async goalId => {
    const { currentUser, appState } = get();
    if (!currentUser || !appState) return;
    const originalState = { ...appState };
    const newGoals = { ...originalState.goals };
    delete newGoals[goalId];
    const newActiveGoalId =
      originalState.activeGoalId === goalId ? null : originalState.activeGoalId;
    set({ appState: { ...originalState, goals: newGoals, activeGoalId: newActiveGoalId } });
    try {
      await goalService.deleteGoal(currentUser.uid, goalId);
    } catch (error) {
      console.error('Store: Failed to delete goal', error);
      useNotificationStore.getState().showToast('Failed to delete goal. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  setActiveGoal: async goalId => {
    const { currentUser, appState } = get();
    if (!currentUser || !appState) return;
    const originalActiveGoalId = appState.activeGoalId;
    set(state => ({ appState: { ...state.appState!, activeGoalId: goalId } }));
    try {
      await goalService.setActiveGoal(currentUser.uid, goalId);
    } catch (error) {
      console.error('Store: Failed to set active goal', error);
      useNotificationStore.getState().showToast('Could not switch active goal.', 'error');
      set(state => ({ appState: { ...state.appState!, activeGoalId: originalActiveGoalId } }));
    }
  },

  addTodo: async text => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    try {
      const newItem = await todoService.addTodoItem(currentUser.uid, activeGoalId, text);
      set(state => {
        const goal = state.appState!.goals[activeGoalId];
        const updatedList = [
          newItem,
          ...(goal.toDoList || []).map(item => ({ ...item, order: item.order + 1 })),
        ];
        return {
          appState: {
            ...state.appState!,
            goals: { ...state.appState!.goals, [activeGoalId]: { ...goal, toDoList: updatedList } },
          },
        };
      });
    } catch (error) {
      console.error('Store: Failed to add todo', error);
      useNotificationStore.getState().showToast('Could not add task.', 'error');
    }
  },

  updateTodo: async (itemId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.toDoList.map(item =>
        item.id === itemId ? { ...item, ...updates, updatedAt: Timestamp.now() } : item
      );
      return {
        appState: {
          ...state.appState!,
          goals: { ...state.appState!.goals, [activeGoalId]: { ...goal, toDoList: updatedList } },
        },
      };
    });
    try {
      await todoService.updateTodoItem(currentUser.uid, activeGoalId, itemId, updates);
    } catch (error) {
      console.error('Store: Failed to update todo', error);
      useNotificationStore.getState().showToast('Failed to update task. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  deleteTodo: async itemId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.toDoList.filter(item => item.id !== itemId);
      return {
        appState: {
          ...state.appState!,
          goals: { ...state.appState!.goals, [activeGoalId]: { ...goal, toDoList: updatedList } },
        },
      };
    });
    try {
      await todoService.deleteTodoItem(currentUser.uid, activeGoalId, itemId);
    } catch (error) {
      console.error('Store: Failed to delete todo', error);
      useNotificationStore.getState().showToast('Failed to delete task. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  reorderTodos: async reorderedList => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      return {
        appState: {
          ...state.appState!,
          goals: { ...state.appState!.goals, [activeGoalId]: { ...goal, toDoList: reorderedList } },
        },
      };
    });
    try {
      await todoService.updateTodoListOrder(currentUser.uid, activeGoalId, reorderedList);
    } catch (error) {
      console.error('Store: Failed to reorder todos', error);
      useNotificationStore.getState().showToast('Failed to reorder tasks. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  addDistraction: async title => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    try {
      const newItem = await distractionService.addDistractionItem(
        currentUser.uid,
        activeGoalId,
        title
      );
      set(state => {
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

  updateDistraction: async (itemId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
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
      set({ appState: originalState });
    }
  },

  deleteDistraction: async itemId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
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
      set({ appState: originalState });
    }
  },

  addStickyNote: async (title, content, color) => {
    const { currentUser, appState } = get();
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
      set(state => {
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

  updateStickyNote: async (itemId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
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
      set({ appState: originalState });
    }
  },

  deleteStickyNote: async itemId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
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
      set({ appState: originalState });
    }
  },

  updateRoutineSettings: async newSettings => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, routineSettings: newSettings },
          },
        },
      };
    });
    try {
      await routineService.updateRoutineSettings(currentUser.uid, activeGoalId, newSettings);
    } catch (error) {
      console.error('Store: Failed to update routines', error);
      useNotificationStore.getState().showToast('Failed to update routines. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  saveDailyProgress: async progressData => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedProgress = { ...goal.dailyProgress, [progressData.date]: progressData };
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, dailyProgress: updatedProgress },
          },
        },
      };
    });
    try {
      await routineService.saveDailyProgress(currentUser.uid, activeGoalId, progressData);
    } catch (error) {
      console.error('Store: Failed to save progress', error);
      useNotificationStore.getState().showToast('Failed to save progress. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  addStarredQuote: async quoteId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
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
      set({ appState: originalState });
    }
  },

  removeStarredQuote: async quoteId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    set(state => {
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
      set({ appState: originalState });
    }
  },

  // FIX: Implement the missing stopwatch actions
  updateStopwatchSession: async (dateKey, sessionId, newLabel) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const progress = goal.dailyProgress[dateKey];
      if (!progress) return state;

      const updatedSessions = progress.sessions.map(session =>
        session.id === sessionId
          ? { ...session, label: newLabel, updatedAt: Timestamp.now() }
          : session
      );

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              dailyProgress: {
                ...goal.dailyProgress,
                [dateKey]: { ...progress, sessions: updatedSessions },
              },
            },
          },
        },
      };
    });

    try {
      await stopwatchService.updateStopwatchSession(
        currentUser.uid,
        activeGoalId,
        dateKey,
        sessionId,
        newLabel
      );
    } catch (error) {
      console.error('Store: Failed to update stopwatch session', error);
      useNotificationStore.getState().showToast('Failed to update session. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  deleteStopwatchSession: async (dateKey, sessionId) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const progress = goal.dailyProgress[dateKey];
      if (!progress) return state;

      const updatedSessions = progress.sessions.filter(session => session.id !== sessionId);
      const newTotalDuration = updatedSessions.reduce((sum, session) => sum + session.duration, 0);

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: {
              ...goal,
              dailyProgress: {
                ...goal.dailyProgress,
                [dateKey]: {
                  ...progress,
                  sessions: updatedSessions,
                  totalSessionDuration: newTotalDuration,
                },
              },
            },
          },
        },
      };
    });

    try {
      await stopwatchService.deleteStopwatchSession(
        currentUser.uid,
        activeGoalId,
        dateKey,
        sessionId
      );
    } catch (error) {
      console.error('Store: Failed to delete stopwatch session', error);
      useNotificationStore.getState().showToast('Failed to delete session. Reverting.', 'error');
      set({ appState: originalState });
    }
  },
}));
