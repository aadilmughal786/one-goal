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
import * as todoService from '@/services/todoService';

/**
 * @file app/store/useGoalStore.ts
 * @description The main Zustand store for the application.
 *
 * This store is the single source of truth for the application's core state,
 * including user authentication status and all goal-related data. It provides
 * actions that encapsulate the business logic and interactions with the service layer.
 */

/**
 * Defines the shape of the main application store's state and actions.
 */
interface GoalStore {
  // --- STATE ---
  appState: AppState | null;
  currentUser: User | null;
  isLoading: boolean;

  // --- ACTIONS ---

  // Initialization
  fetchInitialData: (user: User) => Promise<void>;

  // Goal Management
  createGoal: (name: string, endDate: Date, description: string) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setActiveGoal: (goalId: string | null) => Promise<void>;

  // To-Do Management
  addTodo: (text: string) => Promise<void>;
  updateTodo: (itemId: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (itemId: string) => Promise<void>;
  reorderTodos: (reorderedList: TodoItem[]) => Promise<void>;

  // Distraction Management
  addDistraction: (title: string) => Promise<void>;
  updateDistraction: (itemId: string, updates: Partial<DistractionItem>) => Promise<void>;
  deleteDistraction: (itemId: string) => Promise<void>;

  // Sticky Note Management
  addStickyNote: (title: string, content: string, color: StickyNoteColor) => Promise<void>;
  updateStickyNote: (itemId: string, updates: Partial<StickyNote>) => Promise<void>;
  deleteStickyNote: (itemId: string) => Promise<void>;

  // Routine Management
  updateRoutineSettings: (newSettings: UserRoutineSettings) => Promise<void>;
  saveDailyProgress: (progressData: DailyProgress) => Promise<void>;

  // Quote Management
  addStarredQuote: (quoteId: number) => Promise<void>;
  removeStarredQuote: (quoteId: number) => Promise<void>;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  // --- INITIAL STATE ---
  appState: null,
  currentUser: null,
  isLoading: true,

  // --- ACTION IMPLEMENTATIONS ---

  /**
   * Fetches all initial data for a logged-in user and hydrates the store.
   */
  fetchInitialData: async user => {
    set({ currentUser: user, isLoading: true });
    try {
      const appData = await goalService.getUserData(user.uid);
      set({ appState: appData, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user data', error);
      set({ isLoading: false, currentUser: null, appState: null });
    }
  },

  /**
   * Creates a new goal and optimistically updates the local state.
   */
  createGoal: async (name, endDate, description) => {
    const { currentUser } = get();
    if (!currentUser) return;

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
        const newAppState = {
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
    }
  },

  updateGoal: async (goalId, updates) => {
    const { currentUser } = get();
    if (!currentUser) return;
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
      set({ appState: originalState });
    }
  },

  setActiveGoal: async goalId => {
    const { currentUser } = get();
    if (!currentUser) return;
    set(state => ({ appState: { ...state.appState!, activeGoalId: goalId } }));
    try {
      await goalService.setActiveGoal(currentUser.uid, goalId);
    } catch (error) {
      console.error('Store: Failed to set active goal', error);
    }
  },

  // --- To-Do Actions ---
  addTodo: async text => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    // This is an optimistic update. We modify the local state immediately
    // and then make the server call. This makes the UI feel instant.
    try {
      const newItem = await todoService.addTodoItem(currentUser.uid, activeGoalId, text);
      set(state => {
        const currentGoal = state.appState!.goals[activeGoalId];
        const updatedToDoList = [
          newItem,
          ...(currentGoal.toDoList || []).map(item => ({ ...item, order: item.order + 1 })),
        ];
        const updatedGoal = { ...currentGoal, toDoList: updatedToDoList };
        return {
          appState: {
            ...state.appState!,
            goals: { ...state.appState!.goals, [activeGoalId]: updatedGoal },
          },
        };
      });
    } catch (error) {
      console.error('Store action: Failed to add todo', error);
    }
  },

  updateTodo: async (itemId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    set(state => {
      const currentGoal = state.appState!.goals[activeGoalId];
      const updatedToDoList = currentGoal.toDoList.map(item =>
        item.id === itemId ? { ...item, ...updates, updatedAt: Timestamp.now() } : item
      );
      const updatedGoal = { ...currentGoal, toDoList: updatedToDoList };
      return {
        appState: {
          ...state.appState!,
          goals: { ...state.appState!.goals, [activeGoalId]: updatedGoal },
        },
      };
    });
    try {
      await todoService.updateTodoItem(currentUser.uid, activeGoalId, itemId, updates);
    } catch (error) {
      console.error('Store: Failed to update todo', error);
    }
  },

  deleteTodo: async itemId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    set(state => {
      const currentGoal = state.appState!.goals[activeGoalId];
      const updatedToDoList = currentGoal.toDoList.filter(item => item.id !== itemId);
      const updatedGoal = { ...currentGoal, toDoList: updatedToDoList };
      return {
        appState: {
          ...state.appState!,
          goals: { ...state.appState!.goals, [activeGoalId]: updatedGoal },
        },
      };
    });
    try {
      await todoService.deleteTodoItem(currentUser.uid, activeGoalId, itemId);
    } catch (error) {
      console.error('Store: Failed to delete todo', error);
    }
  },

  reorderTodos: async reorderedList => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    set(state => {
      const currentGoal = state.appState!.goals[activeGoalId];
      const updatedGoal = { ...currentGoal, toDoList: reorderedList };
      return {
        appState: {
          ...state.appState!,
          goals: { ...state.appState!.goals, [activeGoalId]: updatedGoal },
        },
      };
    });
    try {
      await todoService.updateTodoListOrder(currentUser.uid, activeGoalId, reorderedList);
    } catch (error) {
      console.error('Store: Failed to reorder todos', error);
    }
  },

  // --- Distraction Actions ---
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
        const updatedList = [...goal.notToDoList, newItem];
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
    } catch (error) {
      console.error('Store: Failed to add distraction', error);
    }
  },
  updateDistraction: async (itemId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
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
    }
  },
  deleteDistraction: async itemId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.notToDoList.filter(item => item.id !== itemId);
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
      await distractionService.deleteDistractionItem(currentUser.uid, activeGoalId, itemId);
    } catch (error) {
      console.error('Store: Failed to delete distraction', error);
    }
  },

  // --- Sticky Note Actions ---
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
              [activeGoalId]: { ...goal, stickyNotes: [...goal.stickyNotes, newItem] },
            },
          },
        };
      });
    } catch (error) {
      console.error('Store: Failed to add sticky note', error);
    }
  },
  updateStickyNote: async (itemId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.stickyNotes.map(item =>
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
    }
  },
  deleteStickyNote: async itemId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedList = goal.stickyNotes.filter(item => item.id !== itemId);
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
      await stickyNoteService.deleteStickyNote(currentUser.uid, activeGoalId, itemId);
    } catch (error) {
      console.error('Store: Failed to delete sticky note', error);
    }
  },

  // --- Routine & Progress Actions ---
  updateRoutineSettings: async newSettings => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
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
    }
  },
  saveDailyProgress: async progressData => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
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
    }
  },

  // --- Quote Actions ---
  addStarredQuote: async quoteId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
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
    }
  },
  removeStarredQuote: async quoteId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
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
    }
  },
}));
