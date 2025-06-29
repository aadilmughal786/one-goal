// app/(root)/routine/page.tsx
'use client';

import NoActiveGoalMessage from '@/components/common/NoActiveGoalMessage';
import PageContentSkeleton from '@/components/common/PageContentSkeleton'; // NEW: Import the common skeleton
import BathSchedule from '@/components/routine/BathSchedule';
import ExerciseTracker from '@/components/routine/ExerciseTracker';
import MealSchedule from '@/components/routine/MealSchedule';
import SleepSchedule from '@/components/routine/SleepSchedule';
import TeethCare from '@/components/routine/TeethCare';
import WaterTracker from '@/components/routine/WaterTracker';
import { useAuth } from '@/hooks/useAuth';
import { useGoalStore } from '@/store/useGoalStore';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FaTooth } from 'react-icons/fa6';
import { IconType } from 'react-icons/lib';
import {
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

const routineTabItems: {
  id: string;
  label: string;
  icon: IconType;
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

// REFACTOR: This local component is no longer needed.
// const PageMainContentSkeletonLoader = () => ( ... );

const PageSkeletonLoader = () => (
  <div className="flex justify-center items-center h-screen text-white/70">
    <div className="animate-pulse">Loading Routines...</div>
  </div>
);

const RoutinePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { isLoading } = useAuth();
  const appState = useGoalStore(state => state.appState);

  const [isTabContentLoading, setIsTabContentLoading] = useState(false);
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return routineTabItems.find(item => item.id === tabFromUrl)?.id || routineTabItems[0].id;
  });

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
    if (isLoading || isTabContentLoading) {
      // REFACTOR: Use the common skeleton component.
      return <PageContentSkeleton />;
    }

    if (!activeGoal) {
      return <NoActiveGoalMessage />;
    }

    const ActiveComponent = routineTabItems.find(item => item.id === activeTab)?.component;

    if (ActiveComponent) {
      return <ActiveComponent />;
    }
    return null;
  };

  return (
    <main className="flex flex-col min-h-screen text-white bg-black font-poppins">
      <nav className="flex sticky top-0 z-30 justify-center px-4 border-b backdrop-blur-md bg-black/50 border-white/10">
        <div className="flex space-x-1 sm:space-x-2">
          {isLoading
            ? [...Array(routineTabItems.length)].map((_, i) => (
                // FIX: Changed padding from py-4 to py-3 to match the real tabs
                <div key={i} className="px-3 py-3 animate-pulse">
                  <div className="w-20 h-6 rounded-md bg-white/10"></div>
                </div>
              ))
            : routineTabItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
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
