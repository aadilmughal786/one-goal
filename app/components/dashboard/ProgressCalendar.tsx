// app/components/dashboard/ProgressCalendar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Goal, DailyProgress, SatisfactionLevel } from '@/types';
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

interface ProgressCalendarProps {
  goal: Goal;
  dailyProgress: DailyProgress[];
  onDayClick: (date: Date) => void;
}

const ProgressCalendar: React.FC<ProgressCalendarProps> = ({ goal, dailyProgress, onDayClick }) => {
  // Use the goal's start date as the initial month to display
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(goal.startDate.toDate()));

  const goalStartDate = goal.startDate.toDate();
  const goalEndDate = goal.endDate.toDate();

  const progressMap = useMemo(() => {
    const map = new Map<string, DailyProgress>();
    dailyProgress.forEach(progress => {
      const dateKey = format(progress.date.toDate(), 'yyyy-MM-dd');
      map.set(dateKey, progress);
    });
    return map;
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
            const progress = progressMap.get(dateKey);
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

                {/* Tooltip */}
                {progress && (
                  <div className="absolute bottom-full invisible z-20 p-3 mb-2 w-max max-w-xs text-left rounded-lg border shadow-xl opacity-0 transition-opacity duration-300 bg-neutral-900 border-white/10 group-hover:opacity-100 group-hover:visible">
                    <p className="text-sm font-bold">{format(day, 'MMMM d, yyyy')}</p>
                    <hr className="my-1 border-white/10" />
                    <p className="text-xs">
                      <span className="font-semibold">Satisfaction:</span>{' '}
                      {getSatisfactionInfo(progress.satisfactionLevel).label}
                    </p>
                    <p className="text-xs">
                      <span className="font-semibold">Time Spent:</span> {progress.timeSpentMinutes}{' '}
                      mins
                    </p>
                    {progress.notes && (
                      <p className="mt-1 text-xs italic text-white/70">{progress.notes}</p>
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
