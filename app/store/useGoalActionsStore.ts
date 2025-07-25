// app/store/useGoalActionsStore.ts
import * as goalService from '@/services/goalService';
import { AppState, Goal, GoalStatus, CatchingTheFrogTask } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface GoalActionsStore {
  createGoal: (name: string, endDate: Date, description: string) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setActiveGoal: (goalId: string | null) => Promise<void>;
  importGoals: (goalsToImport: Goal[]) => Promise<void>;
  updateRandomPickerItems: (items: string[]) => Promise<void>;
  addCatchingTheFrogTask: (text: string) => Promise<void>;
  updateCatchingTheFrogTask: (
    taskId: string,
    updates: Partial<CatchingTheFrogTask>
  ) => Promise<void>;
  deleteCatchingTheFrogTask: (taskId: string) => Promise<void>;
}

export const useGoalActionsStore = create<GoalActionsStore>(() => ({
  createGoal: async (name, endDate, description) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
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

      useGoalStore.setState(state => {
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
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    if (!currentUser || !appState) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => ({
      appState: {
        ...state.appState!,
        goals: {
          ...state.appState!.goals,
          [goalId]: { ...state.appState!.goals[goalId], ...updates, updatedAt: Timestamp.now() },
        },
      },
    }));
    try {
      await goalService.updateGoal(currentUser.uid, goalId, updates);
    } catch (error) {
      console.error('Store: Failed to update goal', error);
      useNotificationStore.getState().showToast('Failed to update goal. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteGoal: async (goalId: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    if (!currentUser || !appState) return;
    const originalState = { ...appState };
    const newGoals = { ...originalState.goals };
    delete newGoals[goalId];
    const newActiveGoalId =
      originalState.activeGoalId === goalId ? null : originalState.activeGoalId;
    useGoalStore.setState({
      appState: { ...originalState, goals: newGoals, activeGoalId: newActiveGoalId },
    });
    try {
      await goalService.deleteGoal(currentUser.uid, goalId);
    } catch (error) {
      console.error('Store: Failed to delete goal', error);
      useNotificationStore.getState().showToast('Failed to delete goal. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  setActiveGoal: async goalId => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    if (!currentUser || !appState) return;
    const originalActiveGoalId = appState.activeGoalId;
    useGoalStore.setState(state => ({ appState: { ...state.appState!, activeGoalId: goalId } }));
    try {
      await goalService.setActiveGoal(currentUser.uid, goalId);
    } catch (error) {
      console.error('Store: Failed to set active goal', error);
      useNotificationStore.getState().showToast('Could not switch active goal.', 'error');
      useGoalStore.setState(state => ({
        appState: { ...state.appState!, activeGoalId: originalActiveGoalId },
      }));
    }
  },
  importGoals: async (goalsToImport: Goal[]) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    if (!currentUser || !appState) return;

    const originalState = { ...appState };
    const newGoals = { ...appState.goals };

    goalsToImport.forEach(goal => {
      if (goal.status === GoalStatus.ACTIVE) {
        goal.status = GoalStatus.PAUSED;
        goal.updatedAt = Timestamp.now();
      }
      newGoals[goal.id] = goal;
    });

    const newActiveGoalId = appState.activeGoalId;

    const newAppState: AppState = {
      ...appState,
      goals: newGoals,
      activeGoalId: newActiveGoalId,
    };

    useGoalStore.setState({ appState: newAppState });

    try {
      await goalService.setUserData(currentUser.uid, newAppState);
      useNotificationStore.getState().showToast('Goals imported successfully!', 'success');
      await useAuthStore.getState().fetchInitialData(currentUser);
    } catch (error) {
      console.error('Store: Failed to import goals', error);
      useNotificationStore.getState().showToast('Failed to import goals. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
  updateRandomPickerItems: async (items: string[]) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
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
      useGoalStore.setState({ appState: originalState });
    }
  },

  addCatchingTheFrogTask: async (text: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    try {
      const newTask = await goalService.addCatchingTheFrogTask(currentUser.uid, activeGoalId, text);
      useGoalStore.setState(state => {
        const goal = state.appState!.goals[activeGoalId];
        return {
          appState: {
            ...state.appState!,
            goals: {
              ...state.appState!.goals,
              [activeGoalId]: {
                ...goal,
                catchingTheFrogTasks: [...(goal.catchingTheFrogTasks || []), newTask],
              },
            },
          },
        };
      });
      useNotificationStore.getState().showToast('Task added to Catching the Frog!', 'success');
    } catch (error) {
      console.error('Store: Failed to add catching the frog task', error);
      useNotificationStore.getState().showToast('Could not add task.', 'error');
    }
  },

  updateCatchingTheFrogTask: async (taskId: string, updates: Partial<CatchingTheFrogTask>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedTasks = (goal.catchingTheFrogTasks || []).map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      );
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, catchingTheFrogTasks: updatedTasks },
          },
        },
      };
    });

    try {
      await goalService.updateCatchingTheFrogTask(currentUser.uid, activeGoalId, taskId, updates);
      useNotificationStore.getState().showToast('Task updated!', 'success');
    } catch (error) {
      console.error('Store: Failed to update catching the frog task', error);
      useNotificationStore.getState().showToast('Failed to update task. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },

  deleteCatchingTheFrogTask: async (taskId: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;

    const originalState = { ...appState };

    useGoalStore.setState(state => {
      const goal = state.appState!.goals[activeGoalId];
      const updatedTasks = (goal.catchingTheFrogTasks || []).filter(task => task.id !== taskId);
      return {
        appState: {
          ...state.appState!,
          goals: {
            ...state.appState!.goals,
            [activeGoalId]: { ...goal, catchingTheFrogTasks: updatedTasks },
          },
        },
      };
    });

    try {
      await goalService.deleteCatchingTheFrogTask(currentUser.uid, activeGoalId, taskId);
      useNotificationStore.getState().showToast('Task deleted!', 'info');
    } catch (error) {
      console.error('Store: Failed to delete catching the frog task', error);
      useNotificationStore.getState().showToast('Failed to delete task. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
