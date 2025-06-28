// app/hooks/useAuth.ts
'use client';

import { onAuthChange } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
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
  // FIX: Use a ref to track if the fetch has been initiated.
  // This prevents double-fetches caused by React's Strict Mode in development.
  const fetchInitiated = useRef(false);

  // Select state and actions individually to prevent re-renders.
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);
  const currentUser = useGoalStore(state => state.currentUser);
  const appState = useGoalStore(state => state.appState);

  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        // Only fetch data if it has not been initiated yet.
        if (!fetchInitiated.current) {
          fetchInitiated.current = true; // Set the flag immediately
          await fetchInitialData(user);
        }
      } else {
        // If there's no user, stop loading and redirect to the login page.
        setIsLoading(false);
        router.replace('/login');
      }
    });

    // Clean up the Firebase listener when the component unmounts.
    return () => unsubscribe();
    // The dependency array is empty because this effect should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // This effect's only job is to turn off the loading spinner once data is available.
    if (currentUser !== null && appState !== null) {
      setIsLoading(false);
    }
  }, [currentUser, appState]);

  return { isLoading };
};
