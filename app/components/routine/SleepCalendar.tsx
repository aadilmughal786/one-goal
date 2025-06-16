// app/components/routine/SleepCalendar.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoon,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
} from 'react-icons/fi';
import {
  format,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  endOfDay,
  isWithinInterval, // Import isWithinInterval
} from 'date-fns';
import { AppState, DailyProgress, SatisfactionLevel } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { FirebaseServiceError } from '@/utils/errors';

interface SleepCalendarProps {
  appState: AppState | null;
  currentUser: User | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
}

// Custom tooltip component for calendar days
const CustomTooltip = ({
  date,
  dailyProgress,
  onToggleSleep,
  isTogglingSleep,
  isFutureDate,
}: {
  date: Date;
  dailyProgress: DailyProgress | null;
  onToggleSleep: (date: Date) => Promise<void>;
  isTogglingSleep: boolean;
  isFutureDate: boolean;
}) => {
  const isSleepLogged = dailyProgress?.isSleepLogged;

  return (
    <div className="absolute bottom-full left-1/2 invisible z-20 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl opacity-0 transition-opacity duration-300 -translate-x-1/2 bg-neutral-900 border-white/10 group-hover:visible group-hover:opacity-100">
      <p className="p-3 pb-1 font-bold text-white">{format(date, 'MMMM d,PPPP')}</p>
      <hr className="my-1 border-white/10" />
      <div className="px-3 py-2">
        <p className="text-sm">
          <span className="font-semibold">Sleep Status:</span>{' '}
          {isSleepLogged ? (
            <span className="text-green-400">Logged</span>
          ) : (
            <span className="text-red-400">Not Logged</span>
          )}
        </p>
        <button
          onClick={() => onToggleSleep(date)}
          disabled={isTogglingSleep || isFutureDate}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 
            ${
              isFutureDate
                ? 'text-gray-400 bg-gray-700 cursor-not-allowed' // Styling for future dates
                : isSleepLogged
                  ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                  : 'text-green-400 bg-green-500/20 hover:bg-green-500/30'
            } disabled:opacity-50`}
        >
          {isTogglingSleep ? (
            <FiLoader className="animate-spin" size={16} />
          ) : isSleepLogged ? (
            <FiXCircle size={16} />
          ) : (
            <FiCheckCircle size={16} />
          )}
          {isFutureDate ? 'Cannot Log' : isSleepLogged ? 'Mark Not Logged' : 'Mark Logged'}
        </button>
      </div>
      <div className="absolute bottom-0 left-1/2 w-3 h-3 border-r border-b rotate-45 -translate-x-1/2 translate-y-1/2 bg-neutral-900 border-white/10"></div>
    </div>
  );
};

const SleepCalendar: React.FC<SleepCalendarProps> = ({
  appState,
  currentUser,
  showMessage,
  onAppStateUpdate,
}) => {
  // Goal start and end dates from appState.goal
  const goalStartDate = appState?.goal?.createdAt?.toDate();
  const goalEndDate = appState?.goal?.endDate?.toDate(); // This is the goal deadline

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Initialize with the goal's createdAt date's month, matching ProgressCalendar
    if (goalStartDate) {
      return startOfMonth(goalStartDate);
    }
    return startOfMonth(new Date()); // Fallback to current month if no goal yet
  });
  const [isTogglingSleep, setIsTogglingSleep] = useState(false);

  // Get all days within the entire goal interval
  const goalDays = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  // Calculate days to display in the current month, filtered to only include goal days
  const daysInView = useMemo(() => {
    // If no goal, no days to show
    if (!goalStartDate || !goalEndDate) return [];

    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays, goalEndDate, goalStartDate]); // Dependencies are correct here

  // Navigation logic identical to ProgressCalendar
  const canGoToPrevMonth = useMemo(() => {
    if (!goalStartDate) return false; // If no goal, no prev navigation
    return !isSameMonth(currentMonth, startOfMonth(goalStartDate));
  }, [currentMonth, goalStartDate]);

  const canGoToNextMonth = useMemo(() => {
    if (!goalEndDate) return false; // If no goal, no next navigation
    return !isSameMonth(currentMonth, endOfMonth(goalEndDate));
  }, [currentMonth, goalEndDate]);

  // Navigation handlers identical to ProgressCalendar
  const handlePrevMonth = useCallback(() => {
    if (canGoToPrevMonth) {
      setCurrentMonth(prev => subMonths(prev, 1));
    }
  }, [canGoToPrevMonth]);

  const handleNextMonth = useCallback(() => {
    if (canGoToNextMonth) {
      setCurrentMonth(prev => addMonths(prev, 1));
    }
  }, [canGoToNextMonth]);

  const handleToggleSleepLogged = useCallback(
    async (date: Date) => {
      if (!currentUser) {
        showMessage('You must be logged in to update sleep status.', 'error');
        return;
      }
      // Prevent logging for future dates (strictly past or today)
      if (endOfDay(date).getTime() > endOfDay(new Date()).getTime()) {
        showMessage('Cannot log sleep for future dates.', 'info');
        return;
      }

      setIsTogglingSleep(true);
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingProgress = appState?.dailyProgress?.[dateKey];

      const newIsSleepLogged = !(existingProgress?.isSleepLogged === true);

      const updatedProgress: DailyProgress = {
        date: dateKey,
        satisfactionLevel: existingProgress?.satisfactionLevel || SatisfactionLevel.MEDIUM,
        progressNote: existingProgress?.progressNote || '',
        stopwatchSessions: existingProgress?.stopwatchSessions || [],
        effortTimeMinutes: existingProgress?.effortTimeMinutes || 0,
        isSleepLogged: newIsSleepLogged,
        createdAt: existingProgress?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('Attempting to save daily progress with:', updatedProgress);

      try {
        await firebaseService.saveDailyProgress(currentUser.uid, updatedProgress);
        showMessage('Sleep status updated!', 'success');
        const updatedAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(updatedAppState);
      } catch (error: unknown) {
        if (error instanceof FirebaseServiceError) {
          console.error('Original Firebase Error:', error.originalError);
          showMessage(`Failed to update sleep status: ${error.message}`, 'error');
        } else {
          console.error('Unknown error during sleep status update:', error);
          showMessage('Failed to update sleep status.', 'error');
        }
      } finally {
        setIsTogglingSleep(false);
      }
    },
    [currentUser, appState, showMessage, onAppStateUpdate]
  );

  // Render a loading state or "Set Goal" message if appState or goal is not ready
  if (!appState || !appState.goal) {
    return (
      <div className="p-10 text-center text-white/60">
        <FiMoon className="mx-auto mb-4 text-4xl" />
        <p>Set a goal to start tracking your sleep in the calendar.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">
          Sleep Log Calendar - {format(currentMonth, 'MMMMPPPP')}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoToPrevMonth}
            className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            disabled={!canGoToNextMonth}
            className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10 disabled:opacity-30"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Days Container (Flexbox with wrapping) */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Render days only if daysInView is not empty */}
        {daysInView.length > 0 ? (
          daysInView.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const progress = appState.dailyProgress?.[dateKey] || null;
            const isSleepLogged = progress?.isSleepLogged === true;
            const isCurrentDay = isToday(day);
            const isFutureDate = endOfDay(day).getTime() > endOfDay(new Date()).getTime();

            // --- Applying exact ProgressCalendar dayClasses logic here, adapted for Sleep ---
            let dayClasses =
              'relative group flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-200 ';

            // Base color based on sleep logged status
            dayClasses += isSleepLogged ? 'bg-green-500/50' : 'bg-white/5';

            // Apply 'today' border if it's the current day
            if (isCurrentDay) {
              dayClasses += ' border-2 border-blue-400';
            }

            // If it's a future date, override styling to be muted and non-interactive
            if (isFutureDate) {
              dayClasses += ' bg-gray-800/20 text-gray-500 opacity-50 cursor-not-allowed';
            } else {
              // If not a future date, it's clickable and has hover effects
              dayClasses += ' cursor-pointer hover:ring-2 hover:ring-white';
            }
            // --- End of ProgressCalendar adaptation ---

            return (
              <div key={dateKey} className={dayClasses}>
                <span className="text-xs text-white/50">{format(day, 'E')}</span>
                <span className="z-10 text-xl font-bold text-white sm:text-2xl">
                  {format(day, 'd')}
                </span>

                {/* Tooltip with toggle button - only if not a future date */}
                {!isFutureDate && ( // Show tooltip for today or past dates (already within goal range by filter)
                  <CustomTooltip
                    date={day}
                    dailyProgress={progress}
                    onToggleSleep={handleToggleSleepLogged}
                    isTogglingSleep={isTogglingSleep}
                    isFutureDate={isFutureDate}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-10 w-full text-center text-white/50">No goal days in this month.</div>
        )}
      </div>

      {/* Legend for colors */}
      <div className="flex gap-4 justify-center mt-6 text-sm text-white/70">
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-green-500/50"></span>
          <span>Sleep Logged</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full border-2 border-blue-400"></span>
          <span>Today</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-white/5"></span>
          <span>Not Logged (Past)</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-gray-800/20"></span>
          <span>Future Date</span>
        </div>
      </div>
    </div>
  );
};

export default SleepCalendar;
