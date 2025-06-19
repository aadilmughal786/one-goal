// app/components/routine/RoutineCalendar.tsx
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiLoader, FiXCircle } from 'react-icons/fi';
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
  isActive,
}: {
  date: Date;
  dailyProgress: DailyProgress | null;
  onToggle: (date: Date) => Promise<void>;
  isToggling: boolean;
  isFutureDate: boolean;
  routineType: RoutineType;
  isActive: boolean;
}) => {
  const logStatus = dailyProgress?.routineLog?.[routineType];
  const routineName = routineType.charAt(0).toUpperCase() + routineType.slice(1);
  let statusText: React.ReactNode;
  let buttonText: string;
  let ButtonIcon: React.ElementType;

  if (logStatus === true) {
    statusText = <span className="text-green-400">Done</span>;
    buttonText = `Mark as Skipped`;
    ButtonIcon = FiXCircle;
  } else if (logStatus === false) {
    statusText = <span className="text-red-400">Skipped</span>;
    buttonText = `Mark as Done`;
    ButtonIcon = FiCheckCircle;
  } else {
    statusText = <span className="text-white/60">Not Logged</span>;
    buttonText = `Mark as Done`;
    ButtonIcon = FiCheckCircle;
  }

  return (
    <div
      className={`absolute bottom-full left-1/2 invisible z-20 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl transition-opacity duration-300 -translate-x-1/2 bg-neutral-900 border-white/10 group-hover:visible group-hover:opacity-100 cursor-default ${isActive ? '!visible opacity-100' : 'opacity-0'}`}
    >
      <p className="p-3 pb-1 font-bold text-white">{format(date, 'MMMM d, yyyy')}</p>
      <hr className="my-1 border-white/10" />
      <div className="px-3 py-2">
        <p className="text-sm">
          <span className="font-semibold">{routineName} Status:</span> {statusText}
        </p>
        <button
          onClick={() => onToggle(date)}
          disabled={isToggling || isFutureDate}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer
            ${
              isFutureDate
                ? 'text-gray-400 bg-gray-700'
                : 'text-green-400 bg-green-500/20 hover:bg-green-500/30'
            } disabled:opacity-50`}
        >
          {isToggling ? <FiLoader className="animate-spin" size={16} /> : <ButtonIcon size={16} />}
          {isFutureDate ? 'Cannot Log' : buttonText}
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
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside the calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setActiveTooltipDay(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleDayClick = (dateKey: string) => {
    setActiveTooltipDay(prev => (prev === dateKey ? null : dateKey));
  };

  const handleToggleRoutineStatus = useCallback(
    async (date: Date) => {
      if (!currentUser) {
        showMessage('You must be logged in to update routine status.', 'error');
        return;
      }
      if (isFutureDate(date)) {
        showMessage('Cannot log routines for future dates.', 'info');
        return;
      }

      setIsToggling(true);
      const dateKey = format(date, 'yyyy-MM-dd');
      const existingProgress = appState?.dailyProgress?.[dateKey];
      const currentStatus = existingProgress?.routineLog?.[routineType];

      // New logic: if null, set to true. Otherwise, toggle between true and false.
      const newStatus = currentStatus === null ? true : !currentStatus;

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

  const routineName = routineType.charAt(0).toUpperCase() + routineType.slice(1);
  const isFutureDate = (date: Date) => endOfDay(date).getTime() > endOfDay(new Date()).getTime();

  if (!appState || !appState.goal) {
    return (
      <div className="p-10 text-center text-white/60">
        <IconComponent className="mx-auto mb-4 text-4xl" />
        <p>Set a goal to start tracking your {title.toLowerCase()} in the calendar.</p>
      </div>
    );
  }

  return (
    <div
      ref={calendarRef}
      className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b sm:p-6 border-white/10">
        <h3 className="flex gap-2 items-center text-lg font-bold text-white sm:text-xl">
          <IconComponent />
          {title}
        </h3>
        <div className="text-lg font-semibold text-center text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <div className="flex gap-1 sm:gap-2">
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

      {/* Calendar Grid */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {daysInView.length > 0 ? (
            daysInView.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const logStatus = appState.dailyProgress?.[dateKey]?.routineLog?.[routineType];
              const isCurrentDay = isToday(day);
              const isFuture = isFutureDate(day);

              let dayClasses =
                'relative group flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-200 ';

              if (logStatus === true) {
                dayClasses += 'bg-green-500/50';
              } else if (logStatus === false) {
                dayClasses += 'bg-red-500/50';
              } else {
                // Covers null state
                dayClasses += 'bg-white/5';
              }

              if (isCurrentDay) dayClasses += ' border-2 border-blue-400';

              if (isFuture) {
                dayClasses += ' bg-gray-800/20 text-gray-500 opacity-50 ';
              } else {
                dayClasses += ' cursor-pointer hover:ring-2 hover:ring-white';
              }

              return (
                <div
                  key={dateKey}
                  className={dayClasses}
                  onMouseEnter={() => setActiveTooltipDay(null)}
                  onClick={e => {
                    e.stopPropagation();
                    if (!isFuture) {
                      handleDayClick(dateKey);
                    }
                  }}
                >
                  <span className="text-xs text-white/50">{format(day, 'E')}</span>
                  <span className="z-10 text-xl font-bold text-white sm:text-2xl">
                    {format(day, 'd')}
                  </span>
                  {!isFuture && (
                    <CustomTooltip
                      date={day}
                      dailyProgress={appState.dailyProgress?.[dateKey] || null}
                      onToggle={handleToggleRoutineStatus}
                      isToggling={isToggling}
                      isFutureDate={isFuture}
                      routineType={routineType}
                      isActive={activeTooltipDay === dateKey}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-10 w-full text-center text-white/50">
              No goal days in this month.
            </div>
          )}
        </div>
      </div>

      {/* Footer / Legend */}
      <div className="flex flex-wrap gap-y-2 gap-x-4 justify-center p-4 text-sm border-t bg-black/20 border-white/10 text-white/70">
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-green-500/50"></span>
          <span>{routineName} Done</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-red-500/50"></span>
          <span>{routineName} Skipped</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full bg-white/5"></span>
          <span>Not Logged</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4 h-4 rounded-full border-2 border-blue-400"></span>
          <span>Today</span>
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
