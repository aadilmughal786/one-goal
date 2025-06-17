// app/components/routine/RoutineCalendar.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
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
  isWithinInterval,
} from 'date-fns';
import { AppState, DailyProgress, RoutineType, SatisfactionLevel } from '@/types';
import { firebaseService } from '@/services/firebaseService';
import { User } from 'firebase/auth';
import { FirebaseServiceError } from '@/utils/errors';

interface RoutineCalendarProps {
  appState: AppState | null;
  currentUser: User | null;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
  onAppStateUpdate: (newAppState: AppState) => void;
  routineType: RoutineType; // The specific routine this calendar instance will track
  title: string; // The title to display for the calendar, e.g., "Sleep Log"
  icon: React.ElementType; // The icon to display in the header
}

/**
 * A reusable tooltip component for displaying details and actions for a calendar day.
 */
const CustomTooltip = ({
  date,
  dailyProgress,
  onToggle,
  isToggling,
  isFutureDate,
  routineType,
}: {
  date: Date;
  dailyProgress: DailyProgress | null;
  onToggle: (date: Date) => Promise<void>;
  isToggling: boolean;
  isFutureDate: boolean;
  routineType: RoutineType;
}) => {
  const isLogged = dailyProgress?.routineLog?.[routineType] === true;
  const routineName = routineType.charAt(0).toUpperCase() + routineType.slice(1);

  return (
    <div className="absolute bottom-full left-1/2 invisible z-20 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl opacity-0 transition-opacity duration-300 -translate-x-1/2 bg-neutral-900 border-white/10 group-hover:visible group-hover:opacity-100">
      <p className="p-3 pb-1 font-bold text-white">{format(date, 'MMMM d, yyyy')}</p>
      <hr className="my-1 border-white/10" />
      <div className="px-3 py-2">
        <p className="text-sm">
          <span className="font-semibold">{routineName} Status:</span>{' '}
          {isLogged ? (
            <span className="text-green-400">Logged</span>
          ) : (
            <span className="text-red-400">Not Logged</span>
          )}
        </p>
        <button
          onClick={() => onToggle(date)}
          disabled={isToggling || isFutureDate}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 
            ${
              isFutureDate
                ? 'text-gray-400 bg-gray-700 cursor-not-allowed'
                : isLogged
                  ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                  : 'text-green-400 bg-green-500/20 hover:bg-green-500/30'
            } disabled:opacity-50`}
        >
          {isToggling ? (
            <FiLoader className="animate-spin" size={16} />
          ) : isLogged ? (
            <FiXCircle size={16} />
          ) : (
            <FiCheckCircle size={16} />
          )}
          {isFutureDate ? 'Cannot Log' : isLogged ? 'Mark Not Logged' : 'Mark Logged'}
        </button>
      </div>
      <div className="absolute bottom-0 left-1/2 w-3 h-3 border-r border-b rotate-45 -translate-x-1/2 translate-y-1/2 bg-neutral-900 border-white/10"></div>
    </div>
  );
};

/**
 * A generic calendar component for logging the completion of any daily routine.
 */
const RoutineCalendar: React.FC<RoutineCalendarProps> = ({
  appState,
  currentUser,
  showMessage,
  onAppStateUpdate,
  routineType,
  title,
  icon: IconComponent,
}) => {
  const goalStartDate = appState?.goal?.startDate?.toDate();
  const goalEndDate = appState?.goal?.endDate?.toDate();

  const [currentMonth, setCurrentMonth] = useState<Date>(
    goalStartDate ? startOfMonth(goalStartDate) : startOfMonth(new Date())
  );
  const [isToggling, setIsToggling] = useState(false);

  // Get all days within the entire goal interval
  const goalDays = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  // Filter goal days to those visible in the current month
  const daysInView = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays, goalEndDate, goalStartDate]);

  // Navigation logic
  const canGoToPrevMonth = useMemo(
    () => goalStartDate && !isSameMonth(currentMonth, startOfMonth(goalStartDate)),
    [currentMonth, goalStartDate]
  );
  const canGoToNextMonth = useMemo(
    () => goalEndDate && !isSameMonth(currentMonth, endOfMonth(goalEndDate)),
    [currentMonth, goalEndDate]
  );

  const handlePrevMonth = useCallback(() => {
    if (canGoToPrevMonth) setCurrentMonth(prev => subMonths(prev, 1));
  }, [canGoToPrevMonth]);

  const handleNextMonth = useCallback(() => {
    if (canGoToNextMonth) setCurrentMonth(prev => addMonths(prev, 1));
  }, [canGoToNextMonth]);

  const handleToggleRoutineStatus = useCallback(
    async (date: Date) => {
      if (!currentUser) {
        showMessage('You must be logged in to update routine status.', 'error');
        return;
      }
      if (endOfDay(date).getTime() > endOfDay(new Date()).getTime()) {
        showMessage('Cannot log routines for future dates.', 'info');
        return;
      }

      setIsToggling(true);
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingProgress = appState?.dailyProgress?.[dateKey];
      const newStatus = !(existingProgress?.routineLog?.[routineType] === true);

      // Create a default routine log if one doesn't exist
      const newRoutineLog = {
        ...(existingProgress?.routineLog ||
          Object.values(RoutineType).reduce((acc, rt) => ({ ...acc, [rt]: null }), {})),
        [routineType]: newStatus,
      };

      const updatedProgress: DailyProgress = {
        date: dateKey,
        satisfactionLevel: existingProgress?.satisfactionLevel || SatisfactionLevel.MEDIUM,
        progressNote: existingProgress?.progressNote || '',
        stopwatchSessions: existingProgress?.stopwatchSessions || [],
        effortTimeMinutes: existingProgress?.effortTimeMinutes || 0,
        routineLog: newRoutineLog as Record<RoutineType, boolean | null>,
      };

      try {
        await firebaseService.saveDailyProgress(currentUser.uid, updatedProgress);
        showMessage(`${title} status updated!`, 'success');
        const updatedAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(updatedAppState);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof FirebaseServiceError ? error.message : 'An unknown error occurred.';
        showMessage(`Failed to update ${title} status: ${errorMessage}`, 'error');
      } finally {
        setIsToggling(false);
      }
    },
    [currentUser, appState, showMessage, onAppStateUpdate, routineType, title]
  );

  if (!appState || !appState.goal) {
    return (
      <div className="p-10 text-center text-white/60">
        <IconComponent className="mx-auto mb-4 text-4xl" />
        <p>Set a goal to start tracking your {title.toLowerCase()} in the calendar.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="flex gap-2 items-center text-xl font-bold text-white">
          <IconComponent />
          {title} Calendar - {format(currentMonth, 'MMMM yyyy')}
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

      <div className="flex flex-wrap gap-2 justify-center">
        {daysInView.length > 0 ? (
          daysInView.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const progress = appState.dailyProgress?.[dateKey] || null;
            const isLogged = progress?.routineLog?.[routineType] === true;
            const isCurrentDay = isToday(day);
            const isFutureDate = endOfDay(day).getTime() > endOfDay(new Date()).getTime();

            let dayClasses =
              'relative group flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-200 ';
            dayClasses += isLogged ? 'bg-green-500/50' : 'bg-white/5';
            if (isCurrentDay) dayClasses += ' border-2 border-blue-400';
            if (isFutureDate) {
              dayClasses += ' bg-gray-800/20 text-gray-500 opacity-50 cursor-not-allowed';
            } else {
              dayClasses += ' cursor-pointer hover:ring-2 hover:ring-white';
            }

            return (
              <div key={dateKey} className={dayClasses}>
                <span className="text-xs text-white/50">{format(day, 'E')}</span>
                <span className="z-10 text-xl font-bold text-white sm:text-2xl">
                  {format(day, 'd')}
                </span>
                {!isFutureDate && (
                  <CustomTooltip
                    date={day}
                    dailyProgress={progress}
                    onToggle={handleToggleRoutineStatus}
                    isToggling={isToggling}
                    isFutureDate={isFutureDate}
                    routineType={routineType}
                  />
                )}
              </div>
            );
          })
        ) : (
          <div className="py-10 w-full text-center text-white/50">No goal days in this month.</div>
        )}
      </div>

      <div className="flex gap-4 justify-center mt-6 text-sm text-white/70">
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-green-500/50"></span>
          <span>Logged</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full border-2 border-blue-400"></span>
          <span>Today</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-white/5"></span>
          <span>Not Logged</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-gray-800/20"></span>
          <span>Future</span>
        </div>
      </div>
    </div>
  );
};

export default RoutineCalendar;
