// app/components/dashboard/ProgressCalendar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { FiCheck, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Goal, DailyProgress, SatisfactionLevel, RoutineType } from '@/types';
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
} from 'date-fns';
import {
  MdOutlineCleaningServices,
  MdOutlineDirectionsRun,
  MdOutlineNightlight,
  MdOutlineRestaurant,
  MdOutlineShower,
  MdOutlineWaterDrop,
} from 'react-icons/md';

interface ProgressCalendarProps {
  goal: Goal;
  dailyProgress: Record<string, DailyProgress>; // Changed to Record<string, DailyProgress> as per AppState
  onDayClick: (date: Date) => void;
}

const routineIcons: Record<RoutineType, React.ElementType> = {
  [RoutineType.SLEEP]: MdOutlineNightlight,
  [RoutineType.WATER]: MdOutlineWaterDrop,
  [RoutineType.EXERCISE]: MdOutlineDirectionsRun,
  [RoutineType.MEALS]: MdOutlineRestaurant,
  [RoutineType.TEETH]: MdOutlineCleaningServices,
  [RoutineType.BATH]: MdOutlineShower,
};

const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ goal, dailyProgress, onDayClick }) => {
  // Use the goal's createdAt date as the initial month to display
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(goal.startDate.toDate()));

  const goalStartDate = goal.startDate.toDate(); // Corrected to use createdAt
  const goalEndDate = goal.endDate.toDate();

  const progressMap = useMemo(() => {
    // Since dailyProgress is already a Record<string, DailyProgress>, we just use it directly
    // No need to create a new Map from an array
    return dailyProgress;
  }, [dailyProgress]);

  const goalDays = useMemo(() => {
    return eachDayOfInterval({ start: goalStartDate, end: goalEndDate });
  }, [goalStartDate, goalEndDate]);

  const daysInView = useMemo(() => {
    const monthInterval = { start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) };
    return goalDays.filter(day => isWithinInterval(day, monthInterval));
  }, [currentMonth, goalDays]);

  // Disable navigation if the next/prev month is outside the goal's range
  const canGoToPrevMonth = !isSameMonth(currentMonth, goalStartDate);
  const canGoToNextMonth = !isSameMonth(currentMonth, goalEndDate);

  const handlePrevMonth = () => {
    if (canGoToPrevMonth) setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    if (canGoToNextMonth) setCurrentMonth(prev => addMonths(prev, 1));
  };

  const getSatisfactionInfo = (level: SatisfactionLevel): { color: string; label: string } => {
    const info: Record<SatisfactionLevel, { color: string; label: string }> = {
      [SatisfactionLevel.VERY_LOW]: { color: 'bg-red-500/50', label: 'Very Low' },
      [SatisfactionLevel.LOW]: { color: 'bg-orange-500/50', label: 'Low' },
      [SatisfactionLevel.MEDIUM]: { color: 'bg-yellow-500/50', label: 'Medium' },
      [SatisfactionLevel.HIGH]: { color: 'bg-lime-500/50', label: 'High' },
      [SatisfactionLevel.VERY_HIGH]: { color: 'bg-green-500/50', label: 'Very High' },
    };
    return info[level] || { color: 'bg-white/5', label: 'Not Recorded' };
  };

  return (
    <div className="p-4 sm:p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
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
            const progress = progressMap[dateKey]; // Access directly from the record
            const isClickable = isToday(day);

            let dayClasses =
              'relative group flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-200 ';
            dayClasses += progress
              ? getSatisfactionInfo(progress.satisfactionLevel).color
              : 'bg-white/5';
            if (isClickable) dayClasses += ' cursor-pointer hover:ring-2 ring-white';

            if (isToday(day)) {
              dayClasses += ' border-2 border-blue-400';
            }

            return (
              <div
                key={dateKey}
                className={dayClasses}
                onClick={() => isClickable && onDayClick(day)}
              >
                <span className="text-xs text-white/50">{format(day, 'E')}</span>
                <span className="z-10 text-xl font-bold sm:text-2xl">{format(day, 'd')}</span>

                {progress && (
                  <div className="absolute bottom-full invisible z-20 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl opacity-0 transition-opacity duration-300 bg-neutral-900 border-white/10 group-hover:opacity-100 group-hover:visible">
                    <p className="p-3 pb-1 text-sm font-bold text-white">
                      {format(new Date(progress.date), 'MMMM d, yyyy')}
                    </p>
                    <hr className="my-1 border-white/10" />
                    <div className="px-3 py-1 space-y-1">
                      <p className="text-xs">
                        <span className="font-semibold">Satisfaction:</span>{' '}
                        {getSatisfactionInfo(progress.satisfactionLevel).label}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Time Spent:</span>{' '}
                        {progress.effortTimeMinutes || 0} mins
                      </p>
                      {progress.progressNote && (
                        <p className="mt-1 text-xs italic text-white/70">{progress.progressNote}</p>
                      )}
                    </div>
                    {progress.routineLog && (
                      <>
                        <hr className="my-1 border-white/10" />
                        <div className="px-3 py-1">
                          <p className="mb-2 text-sm font-bold text-white">Routine Status</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {Object.entries(progress.routineLog).map(([key, value]) => {
                              const Icon = routineIcons[key as RoutineType];
                              return (
                                <div
                                  key={key}
                                  className="flex items-center gap-1.5"
                                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                                >
                                  <Icon
                                    className={`w-4 h-4 ${value ? 'text-green-400' : 'text-white/40'}`}
                                  />
                                  <span className={`${value ? 'text-green-400' : 'text-white/40'}`}>
                                    {value ? <FiCheck /> : <FiX />}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
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
