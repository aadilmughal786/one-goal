// app/components/dashboard/ProgressCalendar.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react'; // Added useCallback
import { FiCheck, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import {
  Goal,
  DailyProgress,
  SatisfactionLevel,
  RoutineType,
  RoutineLogStatus,
  StopwatchSession,
} from '@/types'; // Import RoutineLogStatus and StopwatchSession
import {
  format,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isSameMonth,
  endOfDay, // Import endOfDay for future date check
} from 'date-fns';
import {
  MdOutlineCleaningServices,
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant, // Corrected from MdOutlineRestaurantMenu to MdOutlineRestaurant
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

interface ProgressCalendarProps {
  goal: Goal;
  dailyProgress: Record<string, DailyProgress>;
  onDayClick: (date: Date) => void;
}

// Mapping of RoutineType enum values to their corresponding React icons
const routineIcons: Record<RoutineType, React.ElementType> = {
  [RoutineType.SLEEP]: MdOutlineNightlight,
  [RoutineType.WATER]: MdOutlineWaterDrop,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEAL]: MdOutlineRestaurant, // Corrected to MEAL (singular)
  [RoutineType.TEETH]: MdOutlineCleaningServices,
  [RoutineType.BATH]: MdOutlineShower,
};

/**
 * ProgressCalendar Component
 *
 * Displays a calendar view for a specific goal, showing daily progress at a glance.
 * Days are color-coded based on satisfaction level. Clicking on a day opens a modal
 * to log or view progress details for that day.
 */
const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ goal, dailyProgress, onDayClick }) => {
  // Extract goal start and end dates from the Goal object
  const goalStartDate = goal.startDate.toDate();
  const goalEndDate = goal.endDate.toDate();

  // State for the currently displayed month in the calendar, initialized to goal start month.
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(goalStartDate));

  // Memoized map of daily progress entries for quick lookup by date key.
  const progressMap = useMemo(() => {
    return dailyProgress;
  }, [dailyProgress]);

  // Memoized list of all days within the entire goal interval.
  const goalDays = useMemo(() => {
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  // Memoized list of days to display in the current month's calendar view, filtered from `goalDays`.
  const daysInView = useMemo(() => {
    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays]);

  // Determine if the "Previous Month" button should be enabled.
  // It's disabled if the current month is the same as the goal's start month.
  const canGoToPrevMonth = !isSameMonth(currentMonth, startOfMonth(goalStartDate));
  // Determine if the "Next Month" button should be enabled.
  // It's disabled if the current month is the same as the goal's end month.
  const canGoToNextMonth = !isSameMonth(currentMonth, endOfMonth(goalEndDate));

  // Callback to navigate to the previous month.
  const handlePrevMonth = useCallback(() => {
    if (canGoToPrevMonth) setCurrentMonth(prev => subMonths(prev, 1));
  }, [canGoToPrevMonth]);

  // Callback to navigate to the next month.
  const handleNextMonth = useCallback(() => {
    if (canGoToNextMonth) setCurrentMonth(prev => addMonths(prev, 1));
  }, [canGoToNextMonth]);

  /**
   * Maps SatisfactionLevel enum values to Tailwind CSS background colors and labels.
   * @param level The SatisfactionLevel enum value.
   * @returns An object with `color` class and `label` string.
   */
  const getSatisfactionInfo = useCallback(
    (level: SatisfactionLevel): { color: string; label: string } => {
      const info: Record<SatisfactionLevel, { color: string; label: string }> = {
        // Aligned with the exact enum member names from types/index.ts
        [SatisfactionLevel.VERY_UNSATISFIED]: { color: 'bg-red-500/50', label: 'Very Unsatisfied' },
        [SatisfactionLevel.UNSATISFIED]: { color: 'bg-orange-500/50', label: 'Unsatisfied' },
        [SatisfactionLevel.NEUTRAL]: { color: 'bg-yellow-500/50', label: 'Neutral' },
        [SatisfactionLevel.SATISFIED]: { color: 'bg-lime-500/50', label: 'Satisfied' }, // Changed to lime
        [SatisfactionLevel.VERY_SATISFIED]: { color: 'bg-green-500/50', label: 'Very Satisfied' },
      };
      // Fallback for when the level is not recorded or unexpected
      return info[level] || { color: 'bg-white/5', label: 'Not Recorded' };
    },
    []
  );

  /**
   * Helper to calculate total duration in minutes from an array of StopwatchSession.
   * @param sessions - Array of StopwatchSession objects.
   * @returns Total duration in minutes.
   */
  const getTotalSessionMinutes = useCallback((sessions: StopwatchSession[] | undefined): number => {
    return (sessions || []).reduce((sum, s) => sum + s.duration, 0) / (1000 * 60); // Convert ms to minutes
  }, []);

  /**
   * Checks if a given date is in the future relative to the end of the current day.
   * @param date The date to check.
   * @returns True if the date is in the future, false otherwise.
   */
  const isFutureDate = useCallback(
    (date: Date) => endOfDay(date).getTime() > endOfDay(new Date()).getTime(),
    []
  );

  return (
    <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      {/* Calendar Header: Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>{' '}
        {/* Added yyyy for clarity */}
        <div className="flex gap-2">
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

      {/* Calendar Grid: Day Cells */}
      <div className="flex flex-wrap gap-2 justify-center">
        {daysInView.length > 0 ? (
          daysInView.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd'); // Format date as key for `progressMap`
            const progress = progressMap[dateKey]; // Get daily progress for this day
            const isFuture = isFutureDate(day); // Check if the day is in the future
            // A day is clickable if it's today AND not a future date (which covers today)
            // Or if it's in the past and not a future date
            const isClickable = !isFuture; // Allow logging for today and past days

            let dayClasses =
              'relative group flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-200 ';

            // Apply background color based on satisfaction level or default
            dayClasses += progress
              ? getSatisfactionInfo(progress.satisfaction).color // Use progress.satisfaction
              : 'bg-white/5';

            // Apply different cursor and hover effects for clickable vs. non-clickable days
            if (isClickable) {
              dayClasses += ' cursor-pointer hover:ring-2 ring-white';
            } else {
              dayClasses += ' opacity-50 cursor-not-allowed'; // Style for non-clickable (future) dates
            }

            // Highlight today's date with a blue border
            if (isToday(day)) {
              dayClasses += ' border-2 border-blue-400';
            }

            return (
              <div
                key={dateKey}
                className={dayClasses}
                onClick={() => isClickable && onDayClick(day)} // Only allow click if `isClickable`
                aria-label={`Progress for ${format(day, 'MMMM d')}`}
              >
                <span className="text-xs text-white/50">{format(day, 'E')}</span>
                <span className="z-10 text-xl font-bold text-white sm:text-2xl">
                  {format(day, 'd')}
                </span>

                {progress && ( // Only render tooltip if there's progress data
                  // Tooltip positioning and visibility. Increased z-index.
                  <div className="absolute bottom-full left-1/2 invisible z-50 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl opacity-0 transition-opacity duration-300 -translate-x-1/2 bg-neutral-900 border-white/10 group-hover:opacity-100 group-hover:visible">
                    <p className="p-3 pb-1 text-sm font-bold text-white">
                      {format(new Date(progress.date), 'MMMM d,PPPP')}
                    </p>
                    <hr className="my-1 border-white/10" />
                    <div className="px-3 py-1 space-y-1">
                      <p className="text-xs">
                        <span className="font-semibold">Satisfaction:</span>{' '}
                        {getSatisfactionInfo(progress.satisfaction).label}{' '}
                        {/* Use progress.satisfaction */}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Time Spent:</span>{' '}
                        {getTotalSessionMinutes(progress.sessions)} mins{' '}
                        {/* Use progress.sessions */}
                      </p>
                      {progress.notes && ( // Use progress.notes
                        <p className="mt-1 text-xs italic text-white/70">{progress.notes}</p>
                      )}
                    </div>
                    {progress.routines && ( // Use progress.routines
                      <>
                        <hr className="my-1 border-white/10" />
                        <div className="px-3 py-1">
                          <p className="mb-2 text-sm font-bold text-white">Routine Status</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {Object.entries(progress.routines).map(([key, value]) => {
                              const Icon = routineIcons[key as RoutineType];
                              let statusClass = '';
                              let statusIcon: React.ReactNode = null;

                              // Apply classes and icons based on RoutineLogStatus
                              if (value === RoutineLogStatus.DONE) {
                                statusClass = 'text-green-400';
                                statusIcon = <FiCheck />;
                              } else if (value === RoutineLogStatus.SKIPPED) {
                                statusClass = 'text-red-400';
                                statusIcon = <FiX />;
                              } else {
                                // RoutineLogStatus.NOT_LOGGED
                                statusClass = 'text-white/40';
                                statusIcon = null; // No specific icon for Not Logged here, or you can use FiMinus
                              }

                              return (
                                <div
                                  key={key}
                                  className="flex items-center gap-1.5"
                                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                                >
                                  <Icon className={`w-4 h-4 ${statusClass}`} />
                                  <span className={statusClass}>{statusIcon}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                    {/* Tooltip arrow */}
                    <div className="absolute bottom-0 left-1/2 w-3 h-3 border-r border-b rotate-45 -translate-x-1/2 translate-y-1/2 bg-neutral-900 border-white/10"></div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-10 w-full text-center text-white/50">No goal days in this month.</div>
        )}
      </div>
    </div>
  );
};

export default ProgressCalendar;
