// app/(root)/routine/page.tsx
'use client';

import { User } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons';
import {
  MdOutlineCleaningServices,
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md'; // Routine icons

import ToastMessage from '@/components/common/ToastMessage';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';

// Import the new common component
import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';

// Import all routine components
import BathSchedule from '@/components/routine/BathSchedule';
import ExerciseTracker from '@/components/routine/ExerciseTracker';
import MealSchedule from '@/components/routine/MealSchedule';
import SleepSchedule from '@/components/routine/SleepSchedule';
import TeethCare from '@/components/routine/TeethCare';
import WaterTracker from '@/components/routine/WaterTracker';

interface TabItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const routineTabItems: TabItem[] = [
  { id: 'sleep', label: 'Sleep', icon: MdOutlineNightlight, component: SleepSchedule },
  { id: 'water', label: 'Water', icon: MdOutlineWaterDrop, component: WaterTracker },
  { id: 'exercise', label: 'Exercise', icon: MdOutlineDirectionsRun, component: ExerciseTracker },
  { id: 'meals', label: 'Meals', icon: MdOutlineRestaurant, component: MealSchedule },
  { id: 'teeth', label: 'Teeth', icon: MdOutlineCleaningServices, component: TeethCare },
  { id: 'bath', label: 'Bath', icon: MdOutlineShower, component: BathSchedule },
];

// Skeleton Loader for lists page to show during data fetching
const RoutinePageSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

const RoutinePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return routineTabItems.find(item => item.id === tabFromUrl)?.id || routineTabItems[0].id;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
  }, []);

  const fetchUserData = useCallback(
    async (uid: string) => {
      try {
        const data = await firebaseService.getUserData(uid);
        setAppState(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showMessage('Failed to load user data.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router, fetchUserData]);

  // --- Tab Navigation Logic (Moved back to top level) ---
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  // --- End Tab Navigation Logic ---

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (routineTabItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  // Get the active goal from appState for conditional rendering
  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const renderActiveTabContent = () => {
    if (isLoading) {
      return <RoutinePageSkeletonLoader />;
    }

    // If no active goal is selected, render the NoActiveGoalMessage component
    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    // Render the specific routine component for the active tab
    const ActiveComponent = routineTabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      return (
        <ActiveComponent
          currentUser={currentUser}
          appState={appState}
          showMessage={showMessage}
          onAppStateUpdate={setAppState} // Pass setAppState to update the main app state
        />
      );
    }
    return null;
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />

      {/* Horizontal Tab Navigation for Routines */}
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-1 sm:space-x-2">
          {isLoading
            ? [...Array(routineTabItems.length)].map((_, i) => (
                <div key={i} className="px-3 py-4 animate-pulse">
                  <div className="w-20 h-6 rounded-md bg-white/10"></div>
                </div>
              ))
            : routineTabItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)} // Now accessible
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                    aria-label={item.label}
                  >
                    <Icon size={18} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>

      {/* Main Content Area for Routines */}
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">{renderActiveTabContent()}</section>
      </div>
    </main>
  );
};

export default function RoutinePage() {
  return (
    <Suspense fallback={<RoutinePageSkeletonLoader />}>
      <RoutinePageContent />
    </Suspense>
  );
}
