// app/(root)/routine/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import ToastMessage from '@/components/ToastMessage';
import { addMinutes } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams
import Link from 'next/link'; // Import Link for navigation

// Import all routine components
import SleepSchedule from '@/components/routine/SleepSchedule';
import MealSchedule from '@/components/routine/MealSchedule';
import BathSchedule from '@/components/routine/BathSchedule';
import TeethCare from '@/components/routine/TeethCare';
import WaterTracker from '@/components/routine/WaterTracker';
import ExerciseTracker from '@/components/routine/ExerciseTracker';

// Import icons for sidebar/tabs
import {
  MdOutlineNightlight, // Sleep
  MdOutlineWaterDrop, // Water
  MdOutlineDirectionsRun, // Exercise
  MdOutlineRestaurant, // Meals
  MdOutlineCleaningServices, // Teeth
  MdOutlineShower, // Bath
} from 'react-icons/md';
import { IconType } from 'react-icons'; // Type for React Icons
import { FiTarget } from 'react-icons/fi'; // Import FiTarget icon

// Define a type for each sidebar item
interface SidebarItem {
  id: string;
  label: string;
  icon: IconType;
  component: React.ComponentType<{
    currentUser: User | null;
    appState: AppState | null;
    showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  }>;
}

const routineSidebarItems: SidebarItem[] = [
  { id: 'sleep', label: 'Sleep', icon: MdOutlineNightlight, component: SleepSchedule },
  { id: 'water', label: 'Water', icon: MdOutlineWaterDrop, component: WaterTracker },
  { id: 'exercise', label: 'Exercise', icon: MdOutlineDirectionsRun, component: ExerciseTracker },
  { id: 'meals', label: 'Meals', icon: MdOutlineRestaurant, component: MealSchedule },
  { id: 'teeth', label: 'Teeth', icon: MdOutlineCleaningServices, component: TeethCare },
  { id: 'bath', label: 'Bath', icon: MdOutlineShower, component: BathSchedule },
];

// Skeleton Loader Component for a single Routine Section Card
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
    <div className="mb-8 h-3 rounded-full bg-white/20">
      <div className="w-3/4 h-3 rounded-full bg-white/10"></div>
    </div>
    <div className="mb-8 space-y-4">
      <div className="mb-3 w-1/2 h-6 rounded-md bg-white/10"></div>
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="flex justify-between items-center p-4 rounded-xl border bg-white/5 border-white/10"
        >
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full bg-white/10"></div>
            <div>
              <div className="mb-2 w-24 h-4 rounded-md bg-white/10"></div>
              <div className="w-32 h-3 rounded-md bg-white/10"></div>
            </div>
          </div>
          <div className="w-16 h-8 rounded-md bg-white/10"></div>
        </div>
      ))}
      <div className="w-full h-12 rounded-lg bg-white/10"></div>
    </div>
    <div className="bg-white/[0.02] rounded-xl p-6 shadow-lg border border-white/10">
      <div className="mb-4 w-1/3 h-6 rounded-md bg-white/10"></div>
      <div className="mb-4 w-full h-12 rounded-lg bg-white/10"></div>
      <div className="w-full h-12 rounded-lg bg-white/10"></div>
    </div>
  </div>
);

const RoutinePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use Next.js hooks for routing and search params
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize activeTab from URL search params or default to the first item
  const [activeTab, setActiveTabInternal] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    const initialTab = routineSidebarItems.find(item => item.id === tabFromUrl);
    return initialTab ? initialTab.id : routineSidebarItems[0].id;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Effect to update current time every second for header display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast message handler
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  }, []);

  // Effect to load user data and routine settings
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthChange(user => {
      if (user) {
        setCurrentUser(user);
        firebaseService
          .getUserData(user.uid)
          .then(data => {
            setAppState(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Failed to load app state:', error);
            showMessage('Failed to load app data.', 'error');
            setIsLoading(false);
          });
      } else {
        setCurrentUser(null);
        setAppState(null);
        setIsLoading(false);
        showMessage('Please log in to manage routines.', 'info');
      }
    });
    return () => unsubscribe();
  }, [showMessage]);

  // Update activeTab state based on URL search params changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && activeTab !== tabFromUrl) {
      const foundTab = routineSidebarItems.find(item => item.id === tabFromUrl);
      if (foundTab) {
        setActiveTabInternal(foundTab.id);
      }
    }
  }, [searchParams, activeTab]); // Depend on searchParams and activeTab

  // Function to update active tab and URL search param
  const handleTabChange = useCallback(
    (tabId: string) => {
      setActiveTabInternal(tabId);
      // Update the URL query parameter using Next.js router
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('tab', tabId);
      router.replace(`?${newSearchParams.toString()}`, { scroll: false }); // Use replace to avoid history clutter
    },
    [router, searchParams]
  );

  // Determine the current day's phase (Morning, Afternoon, Evening, Night)
  const getDayPhase = useCallback(
    (hour: number): string => {
      // Attempt to get sleep settings from appState for accurate phase calculation
      const sleepSettings = appState?.routineSettings?.sleep;
      let bedtimeHour = 22; // Default for "night"
      let sleepDurationMinutes = 8 * 60; // Default 8 hours in minutes

      if (sleepSettings && sleepSettings.scheduledTime) {
        const [bedH] = sleepSettings.scheduledTime.split(':').map(Number);
        bedtimeHour = bedH;
        sleepDurationMinutes = sleepSettings.durationMinutes;
      }

      // Calculate wake time based on bedtime and duration. Assumes sleep crosses midnight if wake is "earlier" than bed.
      const bedtimeDateObj = new Date(currentTime);
      bedtimeDateObj.setHours(bedtimeHour, 0, 0, 0);

      const wakeTimeDateObj = addMinutes(bedtimeDateObj, sleepDurationMinutes);
      // If wake time is on the next day, adjust current time comparison
      if (wakeTimeDateObj.getDate() > bedtimeDateObj.getDate()) {
        if (hour >= bedtimeDateObj.getHours() || hour < wakeTimeDateObj.getHours()) {
          return 'night';
        }
      } else {
        // Sleep and wake on the same day
        if (hour >= bedtimeDateObj.getHours() && hour < wakeTimeDateObj.getHours()) {
          return 'night';
        }
      }

      // Daytime phases
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      return 'evening';
    },
    [appState, currentTime]
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

      {/* Left Sidebar for Routine Navigation */}
      <nav className="flex sticky top-0 flex-col flex-shrink-0 items-center py-4 w-20 h-screen border-r backdrop-blur-md sm:w-24 bg-black/50 border-white/10">
        <div className="overflow-y-auto flex-grow px-2 pb-4 space-y-4 w-full">
          {isLoading // Sidebar skeleton when loading
            ? [...Array(routineSidebarItems.length)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-center items-center px-1 py-3 w-full h-16 rounded-lg animate-pulse bg-white/10"
                >
                  {/* Visual representation of icon and label space */}
                  <div className="mb-1 w-8 h-8 rounded-full bg-white/10"></div>
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

      {/* Main Content Area */}
      <main className="overflow-y-auto flex-grow p-4 md:p-8">
        {/* Page Header with Greeting and Motivation */}
        {isLoading ? (
          <div className="px-4 py-6 mx-auto max-w-4xl text-center animate-pulse">
            <div className="mx-auto mb-2 w-64 h-8 rounded-md bg-white/10"></div>{' '}
            {/* Skeleton for greeting */}
            <div className="mx-auto w-3/4 h-5 rounded-md bg-white/10"></div>{' '}
            {/* Skeleton for quote */}
          </div>
        ) : (
          <div className="px-4 py-6 mx-auto max-w-4xl text-center">
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">{greetingText}</h1>
            <p className="text-lg italic text-white/80">{motivationQuote}</p>
          </div>
        )}

        {/* Conditionally rendered Routine Component or No Goal message */}
        <div className="mx-auto mt-8 space-y-8 max-w-4xl">
          {isLoading ? (
            <RoutineCardSkeleton />
          ) : !appState?.goal ? ( // Check if goal is null after loading
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
          ) : ActiveComponent ? (
            <ActiveComponent
              currentUser={currentUser}
              appState={appState}
              showMessage={showMessage}
            />
          ) : (
            <div className="pt-10 text-center text-white/50">
              <p>Select a routine from the sidebar to view its settings.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoutinePage;
