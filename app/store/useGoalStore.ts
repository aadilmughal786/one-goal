// app/store/useGoalStore.ts
import {
  AppState,
  DailyProgress,
  DistractionItem,
  Goal,
  GoalStatus,
  RoutineLogStatus,
  RoutineType,
  SatisfactionLevel,
  StickyNote,
  StickyNoteColor,
  TimeBlock,
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
import * as stopwatchService from '@/services/stopwatchService';
import * as timeBlockService from '@/services/timeBlockService';
import * as todoService from '@/services/todoService';

// Import the notification store to show error toasts on failure
import { serializeGoalsForExport } from '@/services/dataService';
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
  saveDailyProgress: (progressData: Partial<DailyProgress>) => Promise<void>;
  addStarredQuote: (quoteId: number) => Promise<void>;
  removeStarredQuote: (quoteId: number) => Promise<void>;
  updateStopwatchSession: (dateKey: string, sessionId: string, newLabel: string) => Promise<void>;
  deleteStopwatchSession: (dateKey: string, sessionId: string) => Promise<void>;
  importGoals: (goalsToImport: Goal[]) => Promise<void>;
  updateRandomPickerItems: (items: string[]) => Promise<void>;
  // Add new actions for time blocks
  addTimeBlock: (label: string, startTime: string, endTime: string, color: string) => Promise<void>;
  updateTimeBlock: (blockId: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (blockId: string) => Promise<void>;
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
        errorMessage = error.message;
      }

      useNotificationStore.getState().showToast(errorMessage, 'error');

      if (error instanceof ServiceError && error.code === ServiceErrorCode.VALIDATION_FAILED) {
        const { currentUser } = get();
        if (currentUser) {
          if (error.rawData) {
            try {
              const serializableData = serializeGoalsForExport(
                Object.values(error.rawData as AppState['goals'])
              );
              const dataStr = JSON.stringify(serializableData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `one-goal-corrupted-backup-${
                new Date().toISOString().split('T')[0]
              }.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              useNotificationStore
                .getState()
                .showToast('Corrupted data has been exported for recovery.', 'info');
            } catch (exportError) {
              console.error('Failed to export corrupted data:', exportError);
              useNotificationStore
                .getState()
                .showToast('Could not export corrupted data.', 'error');
            }
          }

          try {
            const defaultState = await goalService.resetUserData(currentUser.uid);
            set({ appState: defaultState, isLoading: false });
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

  importGoals: async goalsToImport => {
    const { currentUser, appState } = get();
    if (!currentUser || !appState) return;

    const originalState = { ...appState };
    const newGoals = { ...appState.goals };

    // Process the imported goals
    goalsToImport.forEach(goal => {
      // If an imported goal is marked as ACTIVE, change its status to PAUSED.
      if (goal.status === GoalStatus.ACTIVE) {
        goal.status = GoalStatus.PAUSED;
        goal.updatedAt = Timestamp.now(); // Also update the timestamp
      }
      // Add the processed goal to our collection.
      newGoals[goal.id] = goal;
    });

    // The activeGoalId remains unchanged.
    const newActiveGoalId = appState.activeGoalId;

    const newAppState: AppState = {
      ...appState,
      goals: newGoals,
      activeGoalId: newActiveGoalId, // Keep the existing active goal ID
    };

    set({ appState: newAppState });

    try {
      await goalService.setUserData(currentUser.uid, newAppState);
      useNotificationStore.getState().showToast('Goals imported successfully!', 'success');
      await get().fetchInitialData(currentUser);
    } catch (error) {
      console.error('Store: Failed to import goals', error);
      useNotificationStore.getState().showToast('Failed to import goals. Reverting.', 'error');
      set({ appState: originalState }); // Rollback on failure
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

  saveDailyProgress: async (progressData: Partial<DailyProgress>) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId || !progressData.date) return;

    const dateKey = progressData.date;
    const originalState = { ...appState };

    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const existingProgress = goal.dailyProgress[dateKey] || {
        date: dateKey,
        satisfaction: SatisfactionLevel.NEUTRAL,
        notes: '',
        sessions: [],
        totalSessionDuration: 0,
        routines: {
          [RoutineType.SLEEP]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.WATER]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.TEETH]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.MEAL]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.BATH]: RoutineLogStatus.NOT_LOGGED,
          [RoutineType.EXERCISE]: RoutineLogStatus.NOT_LOGGED,
        },
        weight: null,
      };

      const updatedDailyData: DailyProgress = {
        ...existingProgress,
        ...progressData,
      };

      const updatedProgressMap = { ...goal.dailyProgress, [dateKey]: updatedDailyData };

      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, dailyProgress: updatedProgressMap },
          },
        },
      };
    });

    try {
      const finalProgressDataForFirebase =
        get().appState!.goals[activeGoalId].dailyProgress[dateKey];
      await routineService.saveDailyProgress(
        currentUser.uid,
        activeGoalId,
        finalProgressDataForFirebase
      );
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

  updateRandomPickerItems: async (items: string[]) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    set(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedGoal = { ...goal, randomPickerItems: items };
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
      await goalService.updateGoal(currentUser.uid, activeGoalId, { randomPickerItems: items });
    } catch (error) {
      console.error('Store: Failed to update picker items', error);
      useNotificationStore
        .getState()
        .showToast('Failed to update picker list. Reverting.', 'error');
      set({ appState: originalState });
    }
  },

  // --- TIME BLOCK ACTIONS ---
  addTimeBlock: async (label, startTime, endTime, color) => {
    const { currentUser, appState } = get();
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

      set(state => {
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
      set({ appState: originalState });
    }
  },

  updateTimeBlock: async (blockId, updates) => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    set(state => {
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
      set({ appState: originalState });
    }
  },

  deleteTimeBlock: async blockId => {
    const { currentUser, appState } = get();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    set(state => {
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
      set({ appState: originalState });
    }
  },
}));
