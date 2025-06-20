// app/(root)/routine/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import ToastMessage from '@/components/common/ToastMessage';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Import all routine components
import SleepSchedule from '@/components/routine/SleepSchedule';
import MealSchedule from '@/components/routine/MealSchedule';
import BathSchedule from '@/components/routine/BathSchedule';
import TeethCare from '@/components/routine/TeethCare';
import WaterTracker from '@/components/routine/WaterTracker';
import ExerciseTracker from '@/components/routine/ExerciseTracker';

// Import icons for sidebar/tabs
import {
  MdOutlineNightlight,
  MdOutlineWaterDrop,
  MdOutlineDirectionsRun,
  MdOutlineRestaurant,
  MdOutlineCleaningServices,
  MdOutlineShower,
} from 'react-icons/md';
import { IconType } from 'react-icons';
import { FiTarget } from 'react-icons/fi';

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>; // Component to render for this tab
}

// Define the routine navigation tabs and their corresponding components
const routineTabItems: TabItem[] = [
  { id: 'sleep', label: 'Sleep', icon: MdOutlineNightlight, component: SleepSchedule },
  { id: 'water', label: 'Water', icon: MdOutlineWaterDrop, component: WaterTracker },
  { id: 'exercise', label: 'Exercise', icon: MdOutlineDirectionsRun, component: ExerciseTracker },
  { id: 'meals', label: 'Meals', icon: MdOutlineRestaurant, component: MealSchedule },
  { id: 'teeth', label: 'Teeth', icon: MdOutlineCleaningServices, component: TeethCare },
  { id: 'bath', label: 'Bath', icon: MdOutlineShower, component: BathSchedule },
];

/**
 * Skeleton loader component for individual routine cards.
 * Displays a pulse animation to indicate loading state.
 */
const RoutineCardSkeleton = () => (
  <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl animate-pulse">
    <div className="flex justify-between items-center mb-6">
      <div className="w-48 h-8 rounded-md bg-white/10"></div>
      <div className="w-20 h-6 rounded-md bg-white/10"></div>
    </div>
    <div className="mb-6 text-center">
      <div className="mx-auto mb-2 w-24 h-10 rounded-md bg-white/10"></div>
      <div className="mx-auto w-32 h-4 rounded-md bg-white/10"></div>
    </div>
    <div className="mb-8 h-3 rounded-full bg-white/20"></div>
    <div className="mb-8 space-y-4">
      <div className="w-full h-16 rounded-lg bg-white/5"></div>
    </div>
    <div className="p-6 rounded-xl border shadow-lg bg-black/20 border-white/10">
      <div className="mb-4 w-1/3 h-6 rounded-md bg-white/10"></div>
      <div className="w-full h-12 rounded-lg bg-white/10"></div>
    </div>
  </div>
);

/**
 * Full page skeleton loader for the Routine Page.
 * Displays a general loading state for the entire page structure.
 */
const RoutinePageSkeleton = () => (
  <div className="flex min-h-screen text-white bg-black border-b animate-pulse font-poppins border-white/10">
    {/* Horizontal Tab Navigation Skeleton */}
    <nav className="flex sticky top-0 z-30 justify-center px-4 w-full border-b backdrop-blur-md bg-black/50 border-white/10">
      <div className="flex space-x-1 sm:space-x-2">
        {[...Array(routineTabItems.length)].map((_, i) => (
          <div key={i} className="px-3 py-4 animate-pulse">
            <div className="w-20 h-6 rounded-md bg-white/10"></div>
          </div>
        ))}
      </div>
    </nav>
    {/* Main Content Area Skeleton */}
    <main className="flex-grow p-4 mx-auto max-w-4xl md:p-8">
      <RoutineCardSkeleton /> {/* Use the card skeleton for the main content area */}
    </main>
  </div>
);

/**
 * Main component for the Routine Tracking page.
 * Manages user authentication, data fetching, tab navigation, and rendering of routine sections.
 */
export default function RoutinePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true); // State to manage overall page loading

  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to access URL search parameters

  // State for the active tab, initialized from URL search params or defaults to the first routine item.
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    // Ensure the tab from URL is a valid one, otherwise default to the first tab.
    return routineTabItems.find(item => item.id === tabFromUrl)?.id || routineTabItems[0].id;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  /**
   * Callback function to display a toast message.
   * This is passed down to child components (routine sections) for user feedback.
   */
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    // Optional: Auto-clear toast after a few seconds
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Effect to handle user authentication and initial data loading.
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        // Fetch user data from Firebase once authenticated
        firebaseService
          .getUserData(user.uid)
          .then(data => {
            setAppState(data);
            setIsLoading(false); // Mark loading as complete after data is fetched
          })
          .catch(error => {
            console.error('Error fetching user data:', error);
            showMessage('Failed to load user data.', 'error');
            setIsLoading(false); // Ensure loading state is cleared even on error
          });
      } else {
        router.replace('/login'); // Redirect to login page if no user is authenticated
      }
    });
    return () => unsubscribe(); // Cleanup the Firebase auth listener
  }, [router, showMessage]); // Dependencies: router and showMessage to ensure effect reacts to their changes

  // Effect to synchronize the active tab state with the URL search parameters.
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      // Only update if the tab from URL is valid and different from current activeTab
      if (routineTabItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]); // Dependencies: searchParams changes or activeTab mismatch

  /**
   * Handles changing the active routine tab.
   * Updates the component's state and the URL search parameters.
   */
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      // Replace the current URL without a full page reload or scroll
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Dynamically get the component to render based on the active tab.
  const ActiveComponent = routineTabItems.find(item => item.id === activeTab)?.component;

  return (
    // Suspense boundary for initial client-side rendering (especially with useSearchParams)
    <Suspense fallback={<RoutinePageSkeleton />}>
      <div className="flex flex-col min-h-screen text-white bg-black font-poppins">
        {/* Toast message display component */}
        <ToastMessage message={toastMessage} type={toastType} />

        {/* Horizontal Tab Navigation for Routines */}
        <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
          <div className="flex space-x-1 sm:space-x-2">
            {isLoading // Show skeleton tabs while loading
              ? [...Array(routineTabItems.length)].map((_, i) => (
                  <div key={i} className="px-3 py-4 animate-pulse">
                    <div className="w-20 h-6 rounded-md bg-white/10"></div>
                  </div>
                ))
              : // Render actual tabs once loaded
                routineTabItems.map(item => {
                  const Icon = item.icon; // Get the icon component for the tab
                  const isActive = activeTab === item.id; // Check if the current tab is active
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                      ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                      aria-label={item.label} // Accessibility label for the button
                    >
                      <Icon size={18} />
                      <span className="hidden sm:inline">{item.label}</span>{' '}
                      {/* Label visible on larger screens */}
                    </button>
                  );
                })}
          </div>
        </nav>

        {/* Main Content Area for Routines */}
        <main className="flex-grow p-4 mx-auto max-w-4xl md:p-8">
          {isLoading ? (
            // Show a specific skeleton for the routine card while loading
            <RoutineCardSkeleton />
          ) : // If not loading and no active goal is set, prompt user to set a goal
          !appState?.activeGoalId || !appState?.goals[appState.activeGoalId] ? (
            <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
              <FiTarget className="mx-auto mb-6 w-20 h-20 text-white/70" />
              <h2 className="mb-4 text-3xl font-bold text-white">No Active Goal Found</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
                You need to set an active primary goal to manage your daily routines. Please select
                or create one in your dashboard settings.
              </p>
              <Link
                href="/dashboard?tab=settings" // Link to dashboard settings to set a goal
                className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
              >
                <FiTarget size={20} />
                Go to Dashboard to Set Goal
              </Link>
            </div>
          ) : (
            // Render the active routine component, passing necessary props
            ActiveComponent && (
              <ActiveComponent
                currentUser={currentUser}
                appState={appState}
                showMessage={showMessage}
                onAppStateUpdate={setAppState} // Pass setAppState to update the main app state
              />
            )
          )}
        </main>
      </div>
    </Suspense>
  );
}
