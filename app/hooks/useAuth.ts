// app/hooks/useAuth.ts
'use client';

import { onAuthChange } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
import { useWellnessStore } from '@/store/useWellnessStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for managing authentication state and initial data loading.
 * This hook centralizes the logic for checking if a user is authenticated,
 * redirecting unauthenticated users, and fetching the initial application data.
 *
 * @returns An object containing the application loading state.
 */
export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiated = useRef(false);

  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);
  const initializeWellness = useWellnessStore(state => state.initialize);

  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        if (!fetchInitiated.current) {
          fetchInitiated.current = true;
          await fetchInitialData(user);
        }
      } else {
        setIsLoading(false);
        router.replace('/login');
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser !== null && appState !== null) {
      // Once the main app state is loaded, initialize the wellness reminders
      const activeGoal = appState.activeGoalId ? appState.goals[appState.activeGoalId] : null;
      if (activeGoal?.wellnessSettings) {
        initializeWellness(activeGoal.wellnessSettings);
      }
      setIsLoading(false);
    }
  }, [currentUser, appState, initializeWellness]);

  return { isLoading };
};
