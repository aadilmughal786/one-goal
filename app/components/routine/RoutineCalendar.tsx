// app/components/routine/RoutineCalendar.tsx
'use client';

import { firebaseService } from '@/services/firebaseService';
import { AppState, DailyProgress, RoutineLogStatus, RoutineType, SatisfactionLevel } from '@/types'; // Import RoutineLogStatus
import { FirebaseServiceError } from '@/utils/errors';
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { User } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiLoader, FiXCircle } from 'react-icons/fi';

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
  // Access the routine status using the correct 'routines' property
  const logStatus = dailyProgress?.routines?.[routineType];
  const routineName = routineType.charAt(0).toUpperCase() + routineType.slice(1);

  let statusText: React.ReactNode;
  let buttonText: string;
  let ButtonIcon: React.ElementType;
  let buttonClass: string;

  // Determine display text, button action, icon, and styling based on RoutineLogStatus enum
  if (logStatus === RoutineLogStatus.DONE) {
    statusText = <span className="text-green-400">Done</span>;
    buttonText = `Mark as Skipped`;
    ButtonIcon = FiXCircle;
    buttonClass = 'text-red-400 bg-red-500/20 hover:bg-red-500/30';
  } else if (logStatus === RoutineLogStatus.SKIPPED) {
    statusText = <span className="text-red-400">Skipped</span>;
    buttonText = `Mark as Not Logged`;
    ButtonIcon = FiCheckCircle; // Can use check as it's the next action to 'Done'
    buttonClass = 'text-white/60 bg-white/10 hover:bg-white/20'; // Neutral color for Not Logged
  } else {
    // Covers RoutineLogStatus.NOT_LOGGED or undefined/null
    statusText = <span className="text-white/60">Not Logged</span>;
    buttonText = `Mark as Done`;
    ButtonIcon = FiCheckCircle;
    buttonClass = 'text-green-400 bg-green-500/20 hover:bg-green-500/30';
  }

  return (
    <div
      className={`absolute bottom-full left-1/2 invisible z-20 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl transition-opacity duration-300 -translate-x-1/2 bg-neutral-900 border-white/10 group-hover:visible group-hover:opacity-100 cursor-default ${isActive ? '!visible opacity-100' : 'opacity-0'}`}
    >
      <p className="p-3 pb-1 font-bold text-white">{format(date, 'MMMM d,yyyy')}</p>
      <hr className="my-1 border-white/10" />
      <div className="px-3 py-2">
        <p className="text-sm">
          <span className="font-semibold">{routineName} Status:</span>{' '}
          <span
            className={
              logStatus === RoutineLogStatus.DONE
                ? 'text-green-400'
                : logStatus === RoutineLogStatus.SKIPPED
                  ? 'text-red-400'
                  : 'text-white/60'
            }
          >
            {statusText}
          </span>
        </p>
        <button
          onClick={() => onToggle(date)}
          disabled={isToggling || isFutureDate}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 cursor-pointer
            ${isFutureDate ? 'text-gray-400 bg-gray-700' : buttonClass} disabled:opacity-50`}
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
  // Moved routineName definition to the top and memoized it
  const routineName = useMemo(
    () => routineType.charAt(0).toUpperCase() + routineType.slice(1),
    [routineType]
  );

  // Get the active goal based on appState and activeGoalId
  const activeGoal = appState?.goals[appState.activeGoalId || ''];

  const goalStartDate = activeGoal?.startDate?.toDate();
  const goalEndDate = activeGoal?.endDate?.toDate();

  // State for the currently displayed month in the calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(
    goalStartDate ? startOfMonth(goalStartDate) : startOfMonth(new Date())
  );
  const [isToggling, setIsToggling] = useState(false); // State for loading indicator on toggle
  const [activeTooltipDay, setActiveTooltipDay] = useState<string | null>(null); // To control which day's tooltip is open
  const calendarRef = useRef<HTMLDivElement>(null); // Ref for detecting clicks outside the calendar

  // Effect to close the tooltip when clicking anywhere outside the calendar.
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

  // Memoized list of all days within the active goal's start and end dates.
  const goalDays = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  // Memoized list of days from `goalDays` that fall within the `currentMonth`'s view.
  const daysInView = useMemo(() => {
    if (!goalStartDate || !goalEndDate) return [];
    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays, goalEndDate, goalStartDate]); // Added dependencies for correctness

  // Determine if the "Previous Month" button should be enabled.
  const canGoToPrevMonth = useMemo(
    () => goalStartDate && !isSameMonth(currentMonth, startOfMonth(goalStartDate)),
    [currentMonth, goalStartDate]
  );

  // Determine if the "Next Month" button should be enabled.
  const canGoToNextMonth = useMemo(
    () => goalEndDate && !isSameMonth(currentMonth, endOfMonth(goalEndDate)),
    [currentMonth, goalEndDate]
  );

  // Callback to navigate to the previous month.
  const handlePrevMonth = useCallback(() => {
    if (canGoToPrevMonth) setCurrentMonth(prev => subMonths(prev, 1));
  }, [canGoToPrevMonth]);

  // Callback to navigate to the next month.
  const handleNextMonth = useCallback(() => {
    if (canGoToNextMonth) setCurrentMonth(prev => addMonths(prev, 1));
  }, [canGoToNextMonth]);

  // Handles clicking on a day cell to open/close its tooltip.
  const handleDayClick = useCallback((dateKey: string) => {
    setActiveTooltipDay(prev => (prev === dateKey ? null : dateKey));
  }, []);

  // Helper to determine if a given date is in the future (relative to end of today).
  const isFutureDate = useCallback(
    (date: Date) => endOfDay(date).getTime() > endOfDay(new Date()).getTime(),
    []
  );

  /**
   * Toggles the completion status of a routine for a specific date.
   * Cycles through RoutineLogStatus: NOT_LOGGED (0) -> DONE (1) -> SKIPPED (2) -> NOT_LOGGED (0).
   * @param date The date for which to toggle the routine status.
   */
  const handleToggleRoutineStatus = useCallback(
    async (date: Date) => {
      if (!currentUser) {
        showMessage('You must be logged in to update routine status.', 'error');
        return;
      }
      if (!appState || !appState.activeGoalId) {
        showMessage(
          'No active goal selected to update routine. Please select a goal first.',
          'error'
        );
        return;
      }
      if (isFutureDate(date)) {
        showMessage('Cannot log routines for future dates.', 'info');
        return;
      }

      setIsToggling(true);
      const dateKey = format(date, 'yyyy-MM-dd');
      const activeGoal = appState.goals[appState.activeGoalId];

      if (!activeGoal) {
        // This case should ideally not happen if appState.activeGoalId is set,
        // but it's a good safeguard.
        showMessage('Active goal not found.', 'error');
        setIsToggling(false);
        return;
      }

      const existingDailyProgress = activeGoal.dailyProgress?.[dateKey];
      const currentStatus = existingDailyProgress?.routines?.[routineType]; // Corrected to 'routines'

      let newStatus: RoutineLogStatus;
      if (currentStatus === RoutineLogStatus.DONE) {
        newStatus = RoutineLogStatus.SKIPPED;
      } else if (currentStatus === RoutineLogStatus.SKIPPED) {
        newStatus = RoutineLogStatus.NOT_LOGGED;
      } else {
        // Covers RoutineLogStatus.NOT_LOGGED or if the routine status is undefined/null
        newStatus = RoutineLogStatus.DONE;
      }

      // Prepare the routines object for the daily progress.
      // Initialize all routine types to NOT_LOGGED, then merge existing, then apply new status.
      const routinesForToday: Record<RoutineType, RoutineLogStatus> = {
        ...Object.values(RoutineType).reduce(
          (acc, rt) => ({ ...acc, [rt]: RoutineLogStatus.NOT_LOGGED }),
          {} as Record<RoutineType, RoutineLogStatus>
        ),
        ...(existingDailyProgress?.routines || {}), // Merge existing routine statuses
        [routineType]: newStatus, // Apply the specific routine type's new status
      };

      const updatedProgress: DailyProgress = {
        date: dateKey,
        // Use existing values from existingDailyProgress or provide defaults
        satisfaction: existingDailyProgress?.satisfaction || SatisfactionLevel.NEUTRAL,
        notes: existingDailyProgress?.notes || '',
        sessions: existingDailyProgress?.sessions || [], // Corrected from 'stopwatchSessions'
        routines: routinesForToday, // Assign the prepared routines object
      };

      try {
        await firebaseService.saveDailyProgress(
          activeGoal.id, // Pass goalId
          currentUser.uid,
          updatedProgress
        );
        showMessage(`${title} status updated!`, 'success');
        // Re-fetch AppState to ensure UI reflects latest data, including goal-specific updates
        const updatedAppState = await firebaseService.getUserData(currentUser.uid);
        onAppStateUpdate(updatedAppState);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof FirebaseServiceError ? error.message : 'An unknown error occurred.';
        console.error(`Error updating ${title} status:`, error);
        showMessage(`Failed to update ${title} status: ${errorMessage}`, 'error');
      } finally {
        setIsToggling(false);
      }
    },
    [currentUser, appState, isFutureDate, routineType, showMessage, title, onAppStateUpdate]
  );

  // If there's no active goal, display a placeholder message.
  if (!activeGoal) {
    return (
      <div className="p-10 text-center text-white/60">
        <IconComponent className="mx-auto mb-4 text-4xl" />
        <p>Set an active goal to start tracking your {title.toLowerCase()} in the calendar.</p>
      </div>
    );
  }

  return (
    <div
      ref={calendarRef} // Attach ref for click-outside detection
      className="bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b sm:p-6 border-white/10">
        <h3 className="flex gap-2 items-center text-lg font-bold text-white sm:text-xl">
          <IconComponent />
          {title}
        </h3>
        <div className="text-lg font-semibold text-center text-white">
          {format(currentMonth, 'MMMM yyyy')} {/* Corrected format to include year */}
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoToPrevMonth}
            className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10 disabled:opacity-30"
            aria-label="Previous month"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            disabled={!canGoToNextMonth}
            className="p-2 rounded-full transition-colors cursor-pointer bg-white/5 hover:bg-white/10 disabled:opacity-30"
            aria-label="Next month"
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
              // Access routine status using 'routines' property
              const logStatus = activeGoal.dailyProgress?.[dateKey]?.routines?.[routineType];
              const isCurrentDay = isToday(day);
              const isFuture = isFutureDate(day);

              let dayClasses =
                'relative group flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-200 ';

              // Apply background color based on log status
              if (logStatus === RoutineLogStatus.DONE) {
                dayClasses += 'bg-green-500/50';
              } else if (logStatus === RoutineLogStatus.SKIPPED) {
                dayClasses += 'bg-red-500/50';
              } else {
                // Covers RoutineLogStatus.NOT_LOGGED or undefined/null
                dayClasses += 'bg-white/5';
              }

              // Highlight today's date with a border
              if (isCurrentDay) dayClasses += ' border-2 border-blue-400';

              // Styling for future dates (disabled appearance) vs. interactive dates
              if (isFuture) {
                dayClasses += ' bg-gray-800/20 text-gray-500 opacity-50 ';
              } else {
                dayClasses += ' cursor-pointer hover:ring-2 hover:ring-white';
              }

              return (
                <div
                  key={dateKey}
                  className={dayClasses}
                  // Reset any active tooltip when mouse enters a new day (if not actively clicked)
                  onMouseEnter={() => setActiveTooltipDay(null)}
                  onClick={e => {
                    e.stopPropagation(); // Prevent click from bubbling up and closing other tooltips
                    if (!isFuture) {
                      handleDayClick(dateKey); // Toggle tooltip for this day
                    }
                  }}
                  aria-label={`${format(day, 'MMMM d')}, Status: ${
                    logStatus === RoutineLogStatus.DONE
                      ? 'Done'
                      : logStatus === RoutineLogStatus.SKIPPED
                        ? 'Skipped'
                        : 'Not Logged'
                  }`}
                >
                  <span className="text-xs text-white/50">{format(day, 'E')}</span>
                  <span className="z-10 text-xl font-bold text-white sm:text-2xl">
                    {format(day, 'd')}
                  </span>
                  {!isFuture && (
                    <CustomTooltip
                      date={day}
                      dailyProgress={activeGoal.dailyProgress?.[dateKey] || null} // Pass dailyProgress for this specific day
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
