// app/store/useAuthStore.ts
import { serializeGoalsForExport } from '@/services/dataService';
import * as goalService from '@/services/goalService';
import { AppState } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { User } from 'firebase/auth';
import { create } from 'zustand';
import { useGoalStore } from './useGoalStore';
import { useNotificationStore } from './useNotificationStore';

interface AuthStore {
  currentUser: User | null;
  isLoading: boolean;
  hasInitialDataFetched: boolean; // Added new state
  fetchInitialData: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: null,
  isLoading: true,
  hasInitialDataFetched: false, // Initialized as false

  fetchInitialData: async (user: User) => {
    const { hasInitialDataFetched } = get();

    // If initial data has already been fetched and current user is set, avoid re-fetching.
    if (hasInitialDataFetched && get().currentUser !== null) {
      set({ currentUser: user, isLoading: false });
      return;
    }

    set({ currentUser: user, isLoading: true, hasInitialDataFetched: false }); // Reset hasInitialDataFetched if a new fetch is truly starting

    try {
      const appData = await goalService.getUserData(user.uid);
      set({ isLoading: false, hasInitialDataFetched: true }); // Mark as fetched on success
      useGoalStore.setState({ appState: appData });
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
            set({ isLoading: false, hasInitialDataFetched: true }); // Mark as fetched on reset
            useGoalStore.setState({ appState: defaultState });
            useNotificationStore
              .getState()
              .showToast('Your data was incompatible and has been safely reset.', 'info');
          } catch (resetError) {
            console.error('Failed to reset user data after validation failure:', resetError);
            set({ isLoading: false, currentUser: null, hasInitialDataFetched: true }); // Mark as fetched even on reset failure
            useGoalStore.setState({ appState: null });
          }
        }
      } else {
        set({ isLoading: false, currentUser: null, hasInitialDataFetched: true }); // Mark as fetched on general error
        useGoalStore.setState({ appState: null });
      }
    }
  },
}));
