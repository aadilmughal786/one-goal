// app/store/useGoalStore.ts
import { AppState } from '@/types';
import { create } from 'zustand';

/**
 * @file app/store/useGoalStore.ts
 * @description The central Zustand store for holding the main application state (`AppState`).
 *
 * This store acts as the single source of truth for the user's goals and related data.
 * Other, more specialized stores (e.g., `useTodoStore`, `useRoutineStore`) will contain
 * the actions and logic to modify this central state. This approach promotes a clean
 * separation of concerns, where this store holds the data, and other stores manage
 * the business logic for their specific domains.
 */

interface GoalState {
  appState: AppState | null;
}

/**
 * The central store for the application's main state.
 * It holds the `appState` object which contains all user goals and related data.
 * This store does not contain any actions itself; it is manipulated by other
 * service-oriented stores.
 */
export const useGoalStore = create<GoalState>(() => ({
  appState: null,
}));
