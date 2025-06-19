// app/components/routine/RoutinePageContent.tsx
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

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
      if (routineTabItems.some(item => item.id === tabFromUrl)) {
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

  const ActiveComponent = routineTabItems.find(item => item.id === activeTab)?.component;

  return (
    <div className="flex flex-col min-h-screen text-white bg-black font-poppins">
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
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-200 border-b-2 focus:outline-none
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
      <main className="flex-grow p-4 mx-auto max-w-4xl md:p-8">
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
              href="/dashboard?tab=settings"
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
      </main>
    </div>
  );
};

export default RoutinePageContent;
