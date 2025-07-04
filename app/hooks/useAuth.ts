// app/hooks/useAuth.ts
'use client';

import { onAuthChange } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react'; // Removed useRef as fetchInitiated is no longer needed.

/**
 * Custom hook for managing authentication state and initial data loading.
 * This hook centralizes the logic for checking if a user is authenticated,
 * redirecting unauthenticated users, and fetching the initial application data.
 *
 * @returns An object containing the application loading state.
 */
export const useAuth = () => {
  const router = useRouter();

  // Get state and actions from the new stores
  const { fetchInitialData, isLoading, currentUser, hasInitialDataFetched } = useAuthStore();
  const { appState } = useGoalStore();
  const { initialize: initializeWellness } = useWellnessStore();

  // Effect to handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        // Only fetch initial data if it hasn't been fetched before in this session.
        // This relies on the global 'hasInitialDataFetched' flag in useAuthStore.
        if (!hasInitialDataFetched) {
          await fetchInitialData(user);
        } else if (!currentUser) {
          // If data was already fetched (hasInitialDataFetched is true)
          // but currentUser is null (e.g., after a browser refresh),
          // set the user and mark loading as false without re-fetching data.
          useAuthStore.setState({ currentUser: user, isLoading: false });
        }
      } else {
        // If no user is found, redirect to the login page.
        router.replace('/login');
      }
    });

    // Clean up the listener when the component unmounts.
    return () => unsubscribe();
    // Added dependencies to ensure useEffect re-runs if critical state changes
  }, [fetchInitialData, hasInitialDataFetched, router, currentUser]);

  // Effect to initialize wellness reminders once data is loaded
  useEffect(() => {
    // Check if the user and appState are loaded.
    if (currentUser && appState) {
      const activeGoal = appState.activeGoalId ? appState.goals[appState.activeGoalId] : null;
      // If there's an active goal with wellness settings, initialize the timers.
      if (activeGoal?.wellnessSettings) {
        initializeWellness(activeGoal.wellnessSettings);
      }
    }
  }, [currentUser, appState, initializeWellness]);

  return { isLoading };
};
