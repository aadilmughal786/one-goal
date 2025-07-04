// app/store/useTodoStore.ts
import * as todoService from '@/services/todoService';
import { TodoItem } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface TodoStore {
  addTodo: (text: string) => Promise<void>;
  updateTodo: (itemId: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (itemId: string) => Promise<void>;
  reorderTodos: (reorderedList: TodoItem[]) => Promise<void>;
}

export const useTodoStore = create<TodoStore>(() => ({
  addTodo: async (text: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    try {
      const newItem = await todoService.addTodoItem(currentUser.uid, activeGoalId, text);
      useGoalStore.setState(state => {
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
  updateTodo: async (itemId: string, updates: Partial<TodoItem>) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => {
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
      useGoalStore.setState({ appState: originalState });
    }
  },
  deleteTodo: async (itemId: string) => {
    const { currentUser } = useAuthStore.getState();
    const { appState } = useGoalStore.getState();
    const activeGoalId = appState?.activeGoalId;
    if (!currentUser || !activeGoalId) return;
    const originalState = { ...appState };
    useGoalStore.setState(state => {
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
      useGoalStore.setState({ appState: originalState });
    }
  },
  reorderTodos: async (reorderedList: TodoItem[]) => {
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
          goals: { ...state.appState!.goals, [activeGoalId]: { ...goal, toDoList: reorderedList } },
        },
      };
    });
    try {
      await todoService.updateTodoListOrder(currentUser.uid, activeGoalId, reorderedList);
    } catch (error) {
      console.error('Store: Failed to reorder todos', error);
      useNotificationStore.getState().showToast('Failed to reorder tasks. Reverting.', 'error');
      useGoalStore.setState({ appState: originalState });
    }
  },
}));
