// app/hooks/useAuth.ts
'use client';

import { onAuthChange } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  // FIX: Select each piece of state individually to prevent infinite re-renders.
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);

  useEffect(() => {
    // Subscribe to authentication state changes.
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        // If a user is found, and we don't have their data yet, fetch it.
        if (!appState) {
          await fetchInitialData(user);
        } else {
          setIsLoading(false);
        }
      } else {
        // If no user is found, redirect to the login page.
        router.replace('/login');
      }
    });

    // Fallback timer to prevent the app from getting stuck in a loading state.
    const initialLoadTimeout = setTimeout(() => {
      if (isLoading && !currentUser && !appState) {
        setIsLoading(false);
      }
    }, 3000); // 3-second timeout for robustness.

    // Cleanup subscription and timeout on component unmount.
    return () => {
      unsubscribe();
      clearTimeout(initialLoadTimeout);
    };
    // FIX: Removed isLoading from dependency array to prevent potential race conditions/loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, fetchInitialData, appState, currentUser]); // Dependencies for the effect.

  useEffect(() => {
    // Once the user and app state are loaded, update the loading state.
    if (currentUser !== null && appState !== null) {
      setIsLoading(false);
    }
  }, [currentUser, appState]);

  return { isLoading };
};
