// app/(root)/routine/RoutinePageContent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import ToastMessage from '@/components/ToastMessage';
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

interface SidebarItem {
  id: string;
  label: string;
  icon: IconType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>; // Use 'any' for simplicity as props vary slightly
}

const routineSidebarItems: SidebarItem[] = [
  { id: 'sleep', label: 'Sleep', icon: MdOutlineNightlight, component: SleepSchedule },
  { id: 'water', label: 'Water', icon: MdOutlineWaterDrop, component: WaterTracker },
  { id: 'exercise', label: 'Exercise', icon: MdOutlineDirectionsRun, component: ExerciseTracker },
  { id: 'meals', label: 'Meals', icon: MdOutlineRestaurant, component: MealSchedule },
  { id: 'teeth', label: 'Teeth', icon: MdOutlineCleaningServices, component: TeethCare },
  { id: 'bath', label: 'Bath', icon: MdOutlineShower, component: BathSchedule },
];

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

const RoutinePageContent = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return (
      routineSidebarItems.find(item => item.id === tabFromUrl)?.id || routineSidebarItems[0].id
    );
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
  }, []);

  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService.getUserData(user.uid).then(data => {
          setAppState(data);
          setIsLoading(false);
        });
      } else {
        router.replace('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      if (routineSidebarItems.some(item => item.id === tabFromUrl)) {
        setActiveTabInternal(tabFromUrl);
      }
    }
  }, [searchParams, activeTab]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const getDayPhase = useCallback(
    (hour: number): string => {
      const sleepSettings = appState?.routineSettings?.sleep;

      if (sleepSettings && sleepSettings.bedtime && sleepSettings.wakeTime) {
        const [bedH] = sleepSettings.bedtime.split(':').map(Number);
        const [wakeH] = sleepSettings.wakeTime.split(':').map(Number);

        if (bedH > wakeH) {
          if (hour >= bedH || hour < wakeH) {
            return 'night';
          }
        } else {
          if (hour >= bedH && hour < wakeH) {
            return 'night';
          }
        }
      }

      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      return 'evening';
    },
    [appState]
  );

  const currentHour = currentTime.getHours();
  const phase = getDayPhase(currentHour);
  const userName = currentUser?.displayName?.split(' ')[0] || 'Explorer';
  const greetingText = `Good ${phase}, ${userName}!`;
  const motivationQuote =
    'Discipline is choosing between what you want now and what you want most.';

  const ActiveComponent = routineSidebarItems.find(item => item.id === activeTab)?.component;

  return (
    <div className="flex min-h-screen text-white bg-black border-b font-poppins border-white/10">
      <ToastMessage message={toastMessage} type={toastType} />

      <nav className="flex sticky top-0 flex-col flex-shrink-0 items-center py-4 w-20 h-screen border-r backdrop-blur-md sm:w-24 bg-black/50 border-white/10">
        <div className="overflow-y-auto flex-grow px-2 pb-4 space-y-4 w-full">
          {isLoading
            ? [...Array(routineSidebarItems.length)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-center items-center px-1 py-3 w-full h-20 rounded-lg animate-pulse bg-white/10"
                >
                  <div className="mb-1 w-8 h-8 rounded-full bg-white/10"></div>
                  <div className="w-12 h-3 rounded-md bg-white/10"></div>
                </div>
              ))
            : routineSidebarItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex flex-col items-center justify-center w-full py-3 px-1 rounded-md transition-all duration-200 focus:outline-none cursor-pointer
                    ${isActive ? 'text-white shadow-md bg-blue-500/70' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Icon size={24} className="sm:text-2xl lg:text-3xl" />
                    <span className="hidden mt-1 text-xs font-medium sm:block">{item.label}</span>
                  </button>
                );
              })}
        </div>
      </nav>

      <main className="overflow-y-auto flex-grow p-4 md:p-8">
        <div className="px-4 py-6 mx-auto max-w-4xl text-center">
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{greetingText}</h1>
          <p className="text-lg italic text-white/80">{motivationQuote}</p>
        </div>

        <div className="mx-auto mt-8 space-y-8 max-w-4xl">
          {isLoading ? (
            <RoutineCardSkeleton />
          ) : !appState?.goal ? (
            <div className="p-10 text-center bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg">
              <FiTarget className="mx-auto mb-6 w-20 h-20 text-white/70" />
              <h2 className="mb-4 text-3xl font-bold text-white">No Goal Found</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
                You need to set a primary goal to manage your daily routines.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex gap-3 items-center px-8 py-4 font-semibold text-black bg-white rounded-full transition-all duration-200 cursor-pointer group hover:bg-white/90 hover:scale-105"
              >
                <FiTarget size={20} />
                Go to Dashboard to Set Goal
              </Link>
            </div>
          ) : (
            ActiveComponent && (
              <ActiveComponent
                currentUser={currentUser}
                appState={appState}
                showMessage={showMessage}
                onAppStateUpdate={setAppState}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default RoutinePageContent;
