// app/components/common/SleepOverlay.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { isAfter, isBefore, parse } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { FiMoon } from 'react-icons/fi';

const SleepOverlay: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissUntil, setDismissUntil] = useState<number | null>(null);

  const activeGoal = useGoalStore(state =>
    state.appState?.activeGoalId ? state.appState.goals[state.appState.activeGoalId] : null
  );

  const sleepSettings = activeGoal?.routineSettings?.sleep;

  // Effect to check session storage on mount
  useEffect(() => {
    try {
      const dismissedTimestamp = sessionStorage.getItem('sleepOverlayDismissedUntil');
      if (dismissedTimestamp && Date.now() < parseInt(dismissedTimestamp, 10)) {
        setIsDismissed(true);
        setDismissUntil(parseInt(dismissedTimestamp, 10));
      }
    } catch (error) {
      console.error('Could not access session storage:', error);
    }
  }, []);

  // Effect to clear dismissal when it expires
  useEffect(() => {
    if (dismissUntil) {
      const timer = setTimeout(() => {
        setIsDismissed(false);
        setDismissUntil(null);
        sessionStorage.removeItem('sleepOverlayDismissedUntil');
      }, dismissUntil - Date.now());
      return () => clearTimeout(timer);
    }
  }, [dismissUntil]);

  const isSleepTime = useMemo(() => {
    if (!sleepSettings) return false;

    const now = new Date();
    const bedtime = parse(sleepSettings.sleepTime, 'HH:mm', now);
    const wakeTime = parse(sleepSettings.wakeTime, 'HH:mm', now);

    // Handle overnight schedules (e.g., 22:00 to 06:00)
    if (isAfter(bedtime, wakeTime)) {
      if (isBefore(now, wakeTime)) {
        // It's the morning after, so we're still in the sleep window
        return true;
      }
      // If it's after bedtime on the current day
      return isAfter(now, bedtime);
    }

    // For same-day schedules (e.g., naps)
    return isAfter(now, bedtime) && isBefore(now, wakeTime);
  }, [sleepSettings]);

  const handleDismiss = () => {
    const fifteenMinutesFromNow = Date.now() + 15 * 60 * 1000;
    try {
      sessionStorage.setItem('sleepOverlayDismissedUntil', fifteenMinutesFromNow.toString());
      setIsDismissed(true);
      setDismissUntil(fifteenMinutesFromNow);
    } catch (error) {
      console.error('Could not set session storage:', error);
      // Still dismiss visually even if storage fails
      setIsDismissed(true);
    }
  };

  if (!isSleepTime || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-center items-center p-8 text-center text-white bg-black/80 backdrop-blur-lg animate-fade-in">
      <div className="flex justify-center items-center mb-8 w-24 h-24 rounded-full border bg-indigo-500/10 border-indigo-500/20">
        <FiMoon className="w-12 h-12 text-indigo-300" />
      </div>
      <h1 className="mb-4 text-4xl font-bold">It&apos;s Time to Rest</h1>
      <p className="mb-8 max-w-md text-lg text-white/70">
        Sticking to your sleep schedule is crucial for achieving your goals. Your progress will be
        waiting for you tomorrow.
      </p>
      <button
        onClick={handleDismiss}
        className="px-6 py-3 font-semibold text-white rounded-full transition-colors cursor-pointer bg-white/10 hover:bg-white/20"
      >
        I&apos;m still up for a bit
      </button>
    </div>
  );
};

export default SleepOverlay;
