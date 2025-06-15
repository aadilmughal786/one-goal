// app/(root)/routine/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { firebaseService } from '@/services/firebaseService';
import { AppState } from '@/types';
import ToastMessage from '@/components/ToastMessage';
import { addMinutes } from 'date-fns';

// Import all routine components
import SleepSchedule from '@/components/routine/SleepSchedule';
import MealSchedule from '@/components/routine/MealSchedule';
import BathSchedule from '@/components/routine/BathSchedule';
import TeethCare from '@/components/routine/TeethCare';
import WaterTracker from '@/components/routine/WaterTracker';
import ExerciseTracker from '@/components/routine/ExerciseTracker';

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Effect to update current time every second for header display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
  }, []);

  // Helper to format current time for header
  const formatHeaderTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Toast message handler
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(text);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Determine the current day's phase (Morning, Afternoon, Evening, Sleep)
  const getDayPhase = useCallback(
    (currentHour: number): string => {
      // Attempt to get sleep settings from appState for accurate phase calculation
      const sleepSettings = appState?.routineSettings?.sleep;
      let bedtimeHour = 22; // Default
      let sleepDurationMinutes = 8 * 60; // Default 8 hours in minutes

      if (sleepSettings) {
        const [bedH] = sleepSettings.scheduledTime.split(':').map(Number);
        bedtimeHour = bedH;
        sleepDurationMinutes = sleepSettings.durationMinutes;
      }

      const bedtimeDate = new Date();
      bedtimeDate.setHours(bedtimeHour, 0, 0, 0);

      const wakeTimeDate = addMinutes(bedtimeDate, sleepDurationMinutes);
      const wakeHour = wakeTimeDate.getHours();

      const nowMinutes = currentHour * 60 + currentTime.getMinutes();
      const sleepMinutes =
        bedtimeHour * 60 + parseInt(sleepSettings?.scheduledTime.split(':')[1] || '0');
      const wakeMinutes = wakeHour * 60 + wakeTimeDate.getMinutes(); // Use minutes from calculated wakeTime

      // Logic to determine if current time is within the sleep window (handles midnight crossing)
      if (sleepMinutes > wakeMinutes) {
        // Sleep crosses midnight
        if (nowMinutes >= sleepMinutes || nowMinutes < wakeMinutes) {
          return 'sleep';
        }
      } else {
        // Sleep within same day
        if (nowMinutes >= sleepMinutes && nowMinutes < wakeMinutes) {
          return 'sleep';
        }
      }

      // Daytime phases
      if (currentHour >= 5 && currentHour < 12) return 'morning';
      if (currentHour >= 12 && currentHour < 18) return 'afternoon';
      return 'evening';
    },
    [appState, currentTime]
  ); // Add appState and currentTime to dependencies

  const currentHour = currentTime.getHours();
  const phase = getDayPhase(currentHour);
  const greeting = currentUser?.displayName
    ? `Welcome, ${currentUser.displayName.split(' ')[0]}!`
    : 'Welcome!';
  const motivationQuote =
    'Discipline is choosing between what you want now and what you want most.';

  return (
    <div className="min-h-screen text-white bg-black font-poppins">
      <ToastMessage message={toastMessage} type={toastType} />

      {/* Page Header with Welcome, Day Phase, Time, and Motivation */}
      <div className="px-4 py-6 mx-auto max-w-4xl text-center">
        <h1 className="mb-2 text-3xl font-bold text-white">{greeting}</h1>
        <p className="mb-4 text-xl capitalize text-white/70">
          Good {phase}, it&apos;s {formatHeaderTime(currentTime)}
        </p>
        <p className="text-lg italic text-white/80">{motivationQuote}</p>
      </div>

      {/* Main Content Area - Single Column */}
      <div className="px-4 pb-8 mx-auto mt-8 space-y-8 max-w-4xl">
        {isLoading ? (
          <>
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
            <RoutineCardSkeleton />
          </>
        ) : (
          <>
            <SleepSchedule {...{ currentUser, appState, showMessage }} />
            <MealSchedule {...{ currentUser, appState, showMessage }} />
            <BathSchedule {...{ currentUser, appState, showMessage }} />
            <TeethCare {...{ currentUser, appState, showMessage }} />
            <WaterTracker {...{ currentUser, appState, showMessage }} />
            <ExerciseTracker {...{ currentUser, appState, showMessage }} />
          </>
        )}
      </div>
    </div>
  );
};

export default RoutinePage;
