// app/hooks/useAuth.ts
'use client';

import { onAuthChange } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useGoalStore } from '@/store/useGoalStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Custom hook for managing authentication state and initial data loading.
 * This hook centralizes the logic for checking if a user is authenticated,
 * redirecting unauthenticated users, and fetching the initial application data.
 *
 * @returns An object containing the application loading state.
 */
export const useAuth = () => {
  const router = useRouter();
  const fetchInitiated = useRef(false);

  // --- Get state and actions from the new stores ---
  const { fetchInitialData, isLoading, currentUser } = useAuthStore();
  const { appState } = useGoalStore();
  const { initialize: initializeWellness } = useWellnessStore();

  // Effect to handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        // If a user is found and data hasn't been fetched yet, fetch it.
        if (!fetchInitiated.current) {
          fetchInitiated.current = true;
          await fetchInitialData(user);
        }
      } else {
        // If no user is found, redirect to the login page.
        router.replace('/login');
      }
    });

    // Clean up the listener when the component unmounts.
    return () => unsubscribe();
    // The dependency array is empty to ensure this runs only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
