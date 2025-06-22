// app/(root)/routine/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { IconType } from 'react-icons'; // Keep IconType import
import {
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import { AppState } from '@/types';

import { onAuthChange } from '@/services/authService';
import { useGoalStore } from '@/store/useGoalStore';
import { useNotificationStore } from '@/store/useNotificationStore';

import BathSchedule from '@/components/routine/BathSchedule';
import ExerciseTracker from '@/components/routine/ExerciseTracker';
import MealSchedule from '@/components/routine/MealSchedule';
import SleepSchedule from '@/components/routine/SleepSchedule';
import TeethCare from '@/components/routine/TeethCare';
import WaterTracker from '@/components/routine/WaterTracker';
import { FaTooth } from 'react-icons/fa6';

const routineTabItems: {
  id: string;
  label: string;
  icon: IconType; // This type is correct for the definition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}[] = [
  { id: 'sleep', label: 'Sleep', icon: MdOutlineNightlight, component: SleepSchedule },
  { id: 'water', label: 'Water', icon: MdOutlineWaterDrop, component: WaterTracker },
  { id: 'exercise', label: 'Exercise', icon: MdOutlineDirectionsRun, component: ExerciseTracker },
  { id: 'meals', label: 'Meals', icon: MdOutlineRestaurant, component: MealSchedule },
  { id: 'teeth', label: 'Teeth', icon: FaTooth, component: TeethCare },
  { id: 'bath', label: 'Bath', icon: MdOutlineShower, component: BathSchedule },
];

const PageMainContentSkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
      <div className="mb-2 w-1/3 h-8 rounded-lg bg-white/10"></div>
      <div className="mb-6 w-full h-4 rounded-lg bg-white/10"></div>
      <div className="space-y-3">
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
        <div className="w-full h-12 rounded-lg bg-white/5"></div>
      </div>
    </div>
  </div>
);

const PageSkeletonLoader = () => (
  <div className="flex justify-center items-center h-screen text-white/70">
    <div className="animate-pulse">Loading Routines...</div>
  </div>
);

const RoutinePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isTabContentLoading, setIsTabContentLoading] = useState(false);

  const [appState, setAppState] = useState<AppState | null>(null);

  const currentUser = useGoalStore(state => state.currentUser);
  const fetchInitialData = useGoalStore(state => state.fetchInitialData);

  const showToast = useNotificationStore(state => state.showToast);

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return routineTabItems.find(item => item.id === tabFromUrl)?.id || routineTabItems[0].id;
  });

  const handleAppStateUpdate = useCallback(
    (newAppState: AppState) => {
      setAppState(newAppState);
    },
    [setAppState]
  );

  useEffect(() => {
    const unsubscribe = onAuthChange(async user => {
      if (user) {
        await fetchInitialData(user);
        setAppState(useGoalStore.getState().appState);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        router.replace('/login');
      }
    });

    const initialLoadTimeout = setTimeout(() => {
      if (isLoading && currentUser === undefined && appState === undefined) {
        setIsLoading(false);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(initialLoadTimeout);
    };
  }, [router, fetchInitialData, showToast, currentUser, isLoading, appState]);

  useEffect(() => {
    if (currentUser !== undefined && appState !== undefined) {
      setIsLoading(false);
    }
  }, [currentUser, appState]);

  useEffect(() => {
    if (!isLoading) {
      setIsTabContentLoading(true);
      const timer = setTimeout(() => {
        setIsTabContentLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [activeTab, isLoading]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const activeGoal = useMemo(() => {
    if (!appState?.activeGoalId || !appState.goals) return null;
    return appState.goals[appState.activeGoalId];
  }, [appState]);

  const renderActiveTabContent = () => {
    if (isLoading) {
      return <PageMainContentSkeletonLoader />;
    }

    if (isTabContentLoading) {
      return <PageMainContentSkeletonLoader />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    const ActiveComponent = routineTabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      const commonProps = {
        currentUser,
        appState,
        onAppStateUpdate: handleAppStateUpdate,
      };
      return <ActiveComponent {...commonProps} />;
    }
    return null;
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-1 sm:space-x-2">
          {isLoading
            ? [...Array(routineTabItems.length)].map((_, i) => (
                <div key={i} className="px-3 py-4 animate-pulse">
                  <div className="w-20 h-6 rounded-md bg-white/10"></div>
                </div>
              ))
            : routineTabItems.map(item => {
                const Icon = item.icon; // Get the Icon component from item.icon
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
                    ${isActive ? 'text-white border-blue-500' : 'border-transparent text-white/60 hover:text-white'}`}
                    aria-label={item.label}
                  >
                    {/* FIXED: Render the Icon component directly */}
                    <Icon size={18} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>
      <div className="container flex-grow p-4 mx-auto max-w-4xl">
        <section className="py-8 w-full">{renderActiveTabContent()}</section>
      </div>
    </main>
  );
};

export default function RoutinePage() {
  return (
    <Suspense fallback={<PageSkeletonLoader />}>
      <RoutinePageContent />
    </Suspense>
  );
}
